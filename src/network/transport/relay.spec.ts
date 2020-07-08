// @ts-ignore
import libp2p = require('libp2p')

// @ts-ignore
import MPLEX = require('libp2p-mplex')
// @ts-ignore
import KadDHT = require('libp2p-kad-dht')
// @ts-ignore
import SECIO = require('libp2p-secio')
// @ts-ignore
import TCP from 'libp2p-tcp'

import PeerId from 'peer-id'

import { Handler } from './types'

import Multiaddr from 'multiaddr'
import PeerInfo from 'peer-info'
import pipe from 'it-pipe'

import Relay from './relay'
import { randomBytes } from 'crypto'

import { privKeyToPeerId } from '../../utils'

const TEST_PROTOCOL = `/test/0.0.1`

const privKeys = [randomBytes(32), randomBytes(32), randomBytes(32)]

describe('should create a socket and connect to it', function () {
  async function generateNode(options: {
    id: number
    ipv4?: boolean
    ipv6?: boolean
    connHandler?: (conn: Handler & { counterparty: PeerId }) => void
  }): Promise<libp2p> {
    const peerInfo = new PeerInfo(await privKeyToPeerId(privKeys[options.id]))

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

    node.relay = new Relay(node, options.connHandler)

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

  it('should create a node and exchange messages', async function () {
    let [sender, relay, counterparty] = await Promise.all([
      generateNode({ id: 0, ipv4: true }),
      generateNode({ id: 1, ipv4: true }),
      generateNode({
        id: 2,
        ipv4: true,
        connHandler: (handler: Handler & { counterparty: PeerId }) => {
          pipe(
            /* prettier-ignore */
            handler.stream,
            handler.stream
          )
        },
      }),
    ])

    await Promise.all([sender.dial(relay.peerInfo), counterparty.dial(relay.peerInfo)])

    const { stream } = await sender.relay.establishRelayedConnection(
      Multiaddr(`/p2p/${counterparty.peerInfo.id.toB58String()}`),
      [relay.peerInfo]
    )

    const pipePromise = pipe(
      // prettier-ignore
      (async function* () {
        yield new Uint8Array([1])

        await new Promise(resolve => setTimeout(resolve, 500))

        await counterparty.stop()

        counterparty = await generateNode({
          id: 2,
          ipv4: true,
          connHandler: (handler: Handler & { counterparty: PeerId }) => {
            console.log(`inside new handler`)
            pipe(
              /* prettier-ignore */
              handler.stream,
              handler.stream
            )
          },
        })

        await counterparty.dial(relay.peerInfo)

        yield new Uint8Array([2])

        await new Promise(resolve => setTimeout(resolve, 500))

        yield new Uint8Array([3])
        yield new Uint8Array([4])

        await counterparty.stop()

        counterparty = await generateNode({
          id: 2,
          ipv4: true,
          connHandler: (handler: Handler & { counterparty: PeerId }) => {
            console.log(`inside new handler`)
            pipe(
              /* prettier-ignore */
              handler.stream,
              handler.stream
            )
          },
        })

        await counterparty.dial(relay.peerInfo)

        yield new Uint8Array([3])

        await new Promise(resolve => setTimeout(resolve, 500))

        yield new Uint8Array([4])
      })(),
      stream,
      async (source: AsyncIterable<Uint8Array>) => {
        for await (const msg of source) {
          console.log(msg)
        }
      }
    )

    // relay.emit('peer:connect', '1234')

    await pipePromise
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
