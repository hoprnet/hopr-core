import assert from 'assert'

// @ts-ignore
import libp2p = require('libp2p')

// @ts-ignore
import MPLEX = require('libp2p-mplex')
// @ts-ignore
import KadDHT = require('libp2p-kad-dht')
// @ts-ignore
import SECIO = require('libp2p-secio')

import PeerId from 'peer-id'

import { Handler } from './types'

import TCP from '.'
import Multiaddr from 'multiaddr'
import PeerInfo from 'peer-info'
import pipe from 'it-pipe'

import { u8aEquals } from '@hoprnet/hopr-utils'

import chalk from 'chalk'
import { randomBytes } from 'crypto'
import { privKeyToPeerId } from '../../utils'
import { RELAY_CIRCUIT_TIMEOUT } from './constants'

const TEST_PROTOCOL = `/test/0.0.1`

describe('should create a socket and connect to it', function () {
  async function generateNode(
    options: {
      id: number
      ipv4?: boolean
      ipv6?: boolean
      useWebRTC?: boolean
      startNode?: boolean
    },
    bootstrap?: PeerInfo
  ): Promise<libp2p> {
    const peerInfo = new PeerInfo(await PeerId.create({ keyType: 'secp256k1' }))

    if (options.ipv4) {
      peerInfo.multiaddrs.add(
        Multiaddr(`/ip4/127.0.0.1/tcp/${9090 + 2 * options.id}`).encapsulate(`/p2p/${peerInfo.id.toB58String()}`)
      )
    }

    if (options.ipv6) {
      peerInfo.multiaddrs.add(
        Multiaddr(`/ip6/::1/tcp/${9090 + 2 * options.id + 1}`).encapsulate(`/p2p/${peerInfo.id.toB58String()}`)
      )
    }

    const node = new libp2p({
      peerInfo,
      modules: {
        transport: [TCP],
        streamMuxer: [MPLEX],
        connEncryption: [SECIO],
        dht: KadDHT,
      },
      config: {
        transport: {
          TCP: {
            useWebRTC: options.useWebRTC,
            bootstrapServers: [bootstrap],
          },
        },
        dht: {
          enabled: false,
        },
        relay: {
          enabled: false,
        },
        peerDiscovery: {
          autoDial: false,
        },
      },
    })

    node.handle(TEST_PROTOCOL, (handler: Handler) => {
      pipe(
        /* prettier-ignore */
        handler.stream,
        // echoing msg
        handler.stream
      )
    })

    await node.start()

    return node
  }

  it('should establish a direct connection between two nodes', async function () {
    const [sender, counterparty] = await Promise.all([
      generateNode({ id: 0, ipv4: true, useWebRTC: false }),
      generateNode({ id: 1, ipv4: true, useWebRTC: false }),
    ])

    const conn = await sender.dialProtocol(
      Multiaddr(`/ip4/127.0.0.1/tcp/9092/p2p/${counterparty.peerInfo.id.toB58String()}`),
      TEST_PROTOCOL
    )

    let msgReceived = false
    const testMessage = randomBytes(123)

    await pipe(
      /* prettier-ignore */
      [testMessage],
      conn.stream,
      async (source: AsyncIterable<Uint8Array>) => {
        for await (const msg of source) {
          assert(u8aEquals(msg.slice(), testMessage), 'sent message and received message must be identical')
          msgReceived = true
          return
        }
      }
    )

    assert(msgReceived, `Message must be received by counterparty.`)

    await Promise.all([sender.stop(), counterparty.stop()])
  })

  it('should establish a direct connection between two nodes over IPv6', async function () {
    const [sender, counterparty] = await Promise.all([
      generateNode({ id: 0, ipv6: true, useWebRTC: false }),
      generateNode({ id: 1, ipv6: true, useWebRTC: false }),
    ])

    const conn = await sender.dialProtocol(
      Multiaddr(`/ip6/::1/tcp/9093/p2p/${counterparty.peerInfo.id.toB58String()}`),
      TEST_PROTOCOL
    )

    let msgReceived = false
    const testMessage = randomBytes(123)

    await pipe(
      /* prettier-ignore */
      [testMessage],
      conn.stream,
      async (source: AsyncIterable<Uint8Array>) => {
        for await (const msg of source) {
          assert(u8aEquals(msg.slice(), testMessage), 'sent message and received message must be identical')
          msgReceived = true
          return
        }
      }
    )

    assert(msgReceived, `Message must be received by counterparty.`)

    await Promise.all([sender.stop(), counterparty.stop()])
  })

  it('must not establish a connection to a non-existing node', async function () {
    const [sender, fakeCounterparty] = await Promise.all([
      generateNode({ id: 0, ipv4: true, useWebRTC: false }),
      privKeyToPeerId(randomBytes(32)),
    ])

    let errThrown = false
    try {
      await sender.dialProtocol(
        Multiaddr(`/ip4/127.0.0.1/tcp/9094/p2p/${fakeCounterparty.toB58String()}`),
        TEST_PROTOCOL
      )
    } catch (err) {
      errThrown = true
    }

    assert(errThrown, `Must throw error in case other node node is not reachable`)

    await Promise.all([sender.stop()])
  })

  it('must not establish a relayed connection to a non-existing node', async function () {
    this.timeout(RELAY_CIRCUIT_TIMEOUT * 2)

    const relay = await generateNode({ id: 2, ipv4: true })

    const [sender, fakeCounterparty] = await Promise.all([
      generateNode({ id: 0, ipv4: true, useWebRTC: false }, relay.peerInfo),
      privKeyToPeerId(randomBytes(32)),
    ])

    connectionHelper([sender, relay])

    let errThrown = false
    const INVALID_PORT = 9999
    try {
      await sender.dialProtocol(
        Multiaddr(`/ip4/127.0.0.1/tcp/${INVALID_PORT}/p2p/${fakeCounterparty.toB58String()}`),
        TEST_PROTOCOL
      )
    } catch (err) {
      errThrown = true
    }

    assert(errThrown, `Must throw error in case other node node is not reachable`)

    await Promise.all([sender.stop(), relay.stop()])
  })

  it('must not establish a relayed connection to an offline node', async function () {
    this.timeout(RELAY_CIRCUIT_TIMEOUT * 2)

    const relay = await generateNode({ id: 2, ipv4: true })

    const [sender, offlineCounterparty] = await Promise.all([
      generateNode({ id: 0, ipv4: true, useWebRTC: false }, relay.peerInfo),
      generateNode({ id: 1, ipv4: true, useWebRTC: false }, relay.peerInfo),
    ])

    connectionHelper([sender, relay])
    connectionHelper([relay, offlineCounterparty])

    await offlineCounterparty.stop()

    let errThrown = false
    const INVALID_PORT = 9999

    const now = Date.now()
    try {
      await sender.dialProtocol(
        Multiaddr(`/ip4/127.0.0.1/tcp/${INVALID_PORT}/p2p/${offlineCounterparty.peerInfo.id.toB58String()}`),
        TEST_PROTOCOL
      )
    } catch (err) {
      errThrown = true
    }

    assert(Date.now() - now >= RELAY_CIRCUIT_TIMEOUT, `Establishing connection must not fail before relay timeout`)

    assert(errThrown, `Must throw error in case other node node is not reachable`)

    await Promise.all([sender.stop(), relay.stop()])
  })

  it('should set up a relayed connection and exchange messages', async function () {
    const relay = await generateNode({ id: 2, ipv4: true, ipv6: true })

    const [sender, counterparty] = await Promise.all([
      generateNode({ id: 0, ipv4: true, useWebRTC: false }, relay.peerInfo),
      generateNode({ id: 1, ipv6: true, useWebRTC: false }, relay.peerInfo),
    ])

    connectionHelper([sender, relay])
    connectionHelper([relay, counterparty])

    const INVALID_PORT = 8758
    const conn2 = await sender.dialProtocol(
      Multiaddr(`/ip4/127.0.0.1/tcp/${INVALID_PORT}/p2p/${counterparty.peerInfo.id.toB58String()}`),
      TEST_PROTOCOL
    )

    const testMessage = new TextEncoder().encode('12356')

    let msgReceived = false
    await pipe(
      /* prettier-ignore */
      [testMessage],
      conn2.stream,
      async (source: AsyncIterable<Uint8Array>) => {
        for await (const msg of source) {
          assert(u8aEquals(msg.slice(), testMessage), 'sent message and received message must be identical')
          msgReceived = true
          return
        }
      }
    )

    assert(msgReceived, `Message must be received by counterparty`)

    await Promise.all([
      sender.stop(),
      counterparty.stop(),
      relay.stop()
    ])
  })

  it('should set up a relayed connection and upgrade to WebRTC', async function () {
    const relay = await generateNode({ id: 2, ipv4: true, ipv6: true })

    const [sender, counterparty] = await Promise.all([
      generateNode({ id: 0, ipv4: true }, relay.peerInfo),
      generateNode({ id: 1, ipv6: true }, relay.peerInfo),
    ])

    console.log(`Sender       ${chalk.yellow(sender.peerInfo.id.toB58String())}`)
    console.log(`Counterparty ${chalk.yellow(counterparty.peerInfo.id.toB58String())}\n`)

    console.log(`Relay        ${chalk.yellow(relay.peerInfo.id.toB58String())}\n`)

    connectionHelper([sender, relay])
    connectionHelper([relay, counterparty])

    // const conn1 = await sender.dial(counterparty.peerInfo)

    // sender.peerStore.remove(counterparty.peerInfo.id)
    // await sender.hangUp(counterparty.peerInfo)

    const INVALID_PORT = 8758
    const conn2 = await sender.dialProtocol(
      Multiaddr(`/ip4/127.0.0.1/tcp/${INVALID_PORT}/p2p/${counterparty.peerInfo.id.toB58String()}`),
      TEST_PROTOCOL
    )

    const testMessage = new TextEncoder().encode('12356')
    await pipe(
      /* prettier-ignore */
      [testMessage],
      conn2.stream,
      async (source: AsyncIterable<Uint8Array>) => {
        for await (const msg of source) {
          assert(u8aEquals(msg.slice(), testMessage), 'sent message and received message must be identical')
          console.log(`message received`)
          return
        }
      }
    )

    await Promise.all([
      sender.stop(),
      counterparty.stop(),
      relay.stop()
    ])
  })
})

/**
 * Informs each node about the others existence.
 * @param nodes Hopr nodes
 */
function connectionHelper(nodes: libp2p[]) {
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      nodes[i].peerStore.put(nodes[j].peerInfo)
      nodes[j].peerStore.put(nodes[i].peerInfo)
    }
  }
}
