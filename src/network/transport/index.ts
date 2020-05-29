import net from 'net'
import abortable from 'abortable-iterator'

import type { Socket } from 'net'
import mafmt from 'mafmt'
const errCode = require('err-code')
const log = require('debug')('hopr-core:transport')
import { socketToConn } from './socket-to-conn'

import AbortController from 'abort-controller'

// @ts-ignore
import handshake = require('it-handshake')

// @ts-ignore
import libp2p = require('libp2p')

import { createListener, Listener } from './listener'
import { multiaddrToNetConfig } from './utils'
import { AbortError } from 'abortable-iterator'
import { USE_WEBRTC, CODE_P2P, RELAY_CIRCUIT_TIMEOUT, USE_OWN_STUN_SERVERS, WEBRTC_TIMEOUT } from './constants'

import Multiaddr from 'multiaddr'
import PeerInfo from 'peer-info'
import PeerId from 'peer-id'

import pipe from 'it-pipe'

import Peer, { Instance as SimplePeerInstance } from 'simple-peer'

// @ts-ignore
import wrtc = require('wrtc')

import { pubKeyToPeerId } from '../../utils'
import { u8aToHex, u8aEquals, u8aAdd } from '@hoprnet/hopr-utils'

import type {
  Connection,
  Upgrader,
  DialOptions,
  Registrar,
  Dialer,
  ConnHandler,
  Handler,
  Stream,
  MultiaddrConnection,
} from './types'

import chalk from 'chalk'

import bl = require('bl')
import pushable, { Pushable } from 'it-pushable'

const RELAY_REGISTER = '/hopr/relay-register/0.0.1'
const RELAY_UNREGISTER = '/hopr/relay-unregister/0.0.1'
const DELIVERY_REGISTER = '/hopr/delivery-register/0.0.1'
const DELIVERY_UNREGISTER = '/hopr/delivery-unregister/0.0.1'
const WEBRTC = '/hopr/webrtc/0.0.1'

const RELAY_DELIVER = (from: Uint8Array) => `/hopr/deliver${u8aToHex(from)}/0.0.1`
const RELAY_FORWARD = (from: Uint8Array, to: Uint8Array) => {
  if (from.length !== to.length) {
    throw Error(`Could not generate RELAY_FORWARD protocol string because array lengths do not match`)
  }

  return `/hopr/forward${u8aToHex(u8aAdd(false, from, to))}/0.0.1`
}

const OK = new TextEncoder().encode('OK')
const FAIL = new TextEncoder().encode('FAIL')

const WEBRTC_TRAFFIC_PREFIX = 1
const REMAINING_TRAFFIC_PREFIX = 0

/**
 * @class TCP
 */
class TCP {
  get [Symbol.toStringTag]() {
    return 'TCP'
  }

  private _useWebRTC: boolean
  private _useOwnStunServers: boolean
  // ONLY FOR TESTING
  private _failIntentionallyOnWebRTC: boolean
  // END ONLY FOR TESTING
  private _upgrader: Upgrader
  private _dialer: Dialer
  private _registrar: Registrar
  private _peerInfo: PeerInfo
  private _handle: (protocols: string[] | string, handler: (connection: Handler) => void) => void
  private _unhandle: (protocols: string[] | string) => void
  private relays?: PeerInfo[]
  private stunServers: { urls: string }[]

  private _encoder: TextEncoder
  private _decoder: TextDecoder

  private connHandler: ConnHandler

  constructor({
    upgrader,
    libp2p,
    bootstrapServers,
    useWebRTC,
    useOwnStunServers,
    failIntentionallyOnWebRTC,
  }: {
    upgrader: Upgrader
    libp2p: libp2p
    bootstrapServers?: PeerInfo[]
    useWebRTC: boolean
    useOwnStunServers: boolean
    failIntentionallyOnWebRTC: boolean
  }) {
    if (!upgrader) {
      throw new Error('An upgrader must be provided. See https://github.com/libp2p/interface-transport#upgrader.')
    }

    if (!libp2p) {
      throw new Error('Transport module needs access to libp2p.')
    }

    if (bootstrapServers !== undefined && bootstrapServers.length > 0) {
      this.relays = bootstrapServers.filter(
        (peerInfo: PeerInfo) => peerInfo !== undefined && !libp2p.peerInfo.id.isEqual(peerInfo.id)
      )

      this.stunServers = []
      for (let i = 0; i < this.relays.length; i++) {
        let urls = ''
        this.relays[i].multiaddrs.forEach((ma: Multiaddr) => {
          if (urls.length > 0) {
            urls += ', '
          }

          const opts = ma.toOptions()

          if (opts.family == 'ipv4') {
            urls += `stun:${opts.host}`
          } else if (opts.family == 'ipv6') {
            // WebRTC seems to have no support IPv6 addresses
            // urls += `stun:[0${opts.host}]`
          }
        })
        this.stunServers.push({ urls })
      }
    }

    this._failIntentionallyOnWebRTC = failIntentionallyOnWebRTC || false
    this._useOwnStunServers = useOwnStunServers === undefined ? USE_OWN_STUN_SERVERS : useOwnStunServers
    this._useWebRTC = useWebRTC === undefined ? USE_WEBRTC : useWebRTC
    this._registrar = libp2p.registrar
    this._handle = libp2p.handle.bind(libp2p)
    this._unhandle = libp2p.unhandle.bind(libp2p)
    this._dialer = libp2p.dialer
    this._peerInfo = libp2p.peerInfo
    this._upgrader = upgrader

    this._encoder = new TextEncoder()
    this._decoder = new TextDecoder()

    this._handle(RELAY_REGISTER, this.handleRelay.bind(this))
    this._handle(RELAY_UNREGISTER, this.handleRelayUnregister.bind(this))
    this._handle(DELIVERY_REGISTER, this.handleDelivery.bind(this))
    this._handle(DELIVERY_UNREGISTER, this.handleDeliveryUnregister.bind(this))
    this._handle(WEBRTC, this.handleWebRTC.bind(this))
  }

  private relayToConn({
    stream,
    counterparty,
    relay,
  }: {
    stream: Stream
    counterparty: PeerId
    relay: PeerId
  }): MultiaddrConnection {
    const maConn: MultiaddrConnection = {
      ...stream,
      conn: stream,
      remoteAddr: Multiaddr(`/p2p/${counterparty.toB58String()}`),
      close: async (err?: Error) => {
        if (err !== undefined) {
          log(err)
        }

        await this.closeConnection(counterparty, relay)

        maConn.timeline.close = Date.now()
      },
      timeline: {
        open: Date.now(),
      },
    }

    return maConn
  }

  handleDeliveryUnregister({ stream }: Handler) {
    pipe(
      /* prettier-ignore */
      stream,
      async (source: AsyncIterable<Uint8Array>) => {
        for await (const msg of source) {
          let counterparty: PeerId
          try {
            counterparty = await pubKeyToPeerId(msg.slice())
          } catch {
            return
          }

          this._unhandle(RELAY_DELIVER(counterparty.pubKey.marshal()))
        }
      }
    )
  }

  async handleDelivery({ stream, connection }: Handler) {
    let shaker = handshake(stream)

    let sender: PeerId

    try {
      sender = await pubKeyToPeerId((await shaker.read()).slice())
    } catch (err) {
      log(`Could not decode sender peerId. Error was: ${err}`)
      shaker.write(FAIL)
      shaker.rest()
      return
    }

    shaker.write(OK)
    shaker.rest()

    let conn: Connection

    const sinkBuffer = pushable<Uint8Array>()
    const srcBuffer = pushable<Uint8Array>()

    const myStream = {
      sink: (source: AsyncIterable<Uint8Array>) => {
        shaker.stream.sink(
          (async function* () {
            for await (const msg of sinkBuffer) {
              yield new bl([new Uint8Array([WEBRTC_TRAFFIC_PREFIX]), msg])
            }
            for await (const msg of source) {
              yield new bl([new Uint8Array([REMAINING_TRAFFIC_PREFIX]), msg])
            }
          })()
        )
      },
      source: (async function* () {
        for await (const msg of shaker.stream.source) {
          if (msg.slice(0, 1)[0] == REMAINING_TRAFFIC_PREFIX) {
            yield msg.slice(1)
          } else if (msg.slice(0, 1)[0] == WEBRTC_TRAFFIC_PREFIX) {
            srcBuffer.push(msg.slice(1))
          }
        }
      })(),
    }

    const relayConn = {
      stream: myStream,
      counterparty: sender,
      relay: connection.remotePeer,
    }

    try {
      if (this._useWebRTC) {
        setTimeout(() => {
          sinkBuffer.end()
          srcBuffer.end()
        }, WEBRTC_TIMEOUT)
        conn = await Promise.race([
          this.handleWebRTC(srcBuffer, sinkBuffer),
          this._upgrader.upgradeInbound(this.relayToConn(relayConn)),
        ])
      } else {
        sinkBuffer.end()
        srcBuffer.end()
        conn = await this._upgrader.upgradeInbound(this.relayToConn(relayConn))
      }
    } catch (err) {
      console.log(err)
    }

    this.connHandler?.call(conn)

    return
  }

  handleRelayUnregister({ stream, connection }: Handler) {
    pipe(
      /* prettier-ignore */
      stream,
      async (source: AsyncIterable<Uint8Array>) => {
        for await (const msg of source) {
          let counterparty: PeerId

          try {
            counterparty = await pubKeyToPeerId(msg.slice())
          } catch {
            return
          }

          this._unhandle(
            RELAY_FORWARD(
              /* prettier-ignore */
              connection.remotePeer.pubKey.marshal(),
              counterparty.pubKey.marshal()
            )
          )

          let conn = this._registrar.getConnection(new PeerInfo(counterparty))

          if (!conn) {
            try {
              conn = await this._dialer.connectToPeer(new PeerInfo(counterparty))
            } catch (err) {
              return
            }
          }

          const { stream: unRegisterStream } = await conn.newStream([DELIVERY_UNREGISTER])

          pipe(
            /* prettier-ignore */
            [counterparty.pubKey.marshal()],
            unRegisterStream
          )
        }
      }
    )
  }

  async closeConnection(counterparty: PeerId, relay: PeerId) {
    this._unhandle(RELAY_DELIVER(counterparty.pubKey.marshal()))

    // @TODO unregister at correct relay node
    let conn = this._registrar.getConnection(new PeerInfo(relay))

    if (!conn) {
      try {
        conn = await this._dialer.connectToPeer(new PeerInfo(relay))
      } catch (err) {
        log(`Could not request relayer ${relay.toB58String()} to tear down relayed connection. Error was:\n`, err)
        return
      }
    }

    const { stream: unRegisterStream } = await conn.newStream([RELAY_UNREGISTER])

    await pipe(
      /* prettier-ignore */
      [counterparty.pubKey.marshal()],
      unRegisterStream
    )

    return
  }

  async handleRelay({ stream, connection }: Handler) {
    const shaker = handshake(stream)

    let counterparty: PeerId

    try {
      counterparty = await pubKeyToPeerId((await shaker.read()).slice())
    } catch (err) {
      log(
        `Peer ${chalk.yellow(
          connection.remotePeer.toB58String()
        )} asked to establish relayed connection to invalid counterparty. Error was ${err}`
      )
      shaker.write(FAIL)
      return
    }

    const abort = new AbortController()

    const timeout = setTimeout(() => abort.abort(), RELAY_CIRCUIT_TIMEOUT)

    let conn: Connection
    try {
      conn =
        this._registrar.getConnection(new PeerInfo(counterparty)) ||
        (await this._dialer.connectToPeer(new PeerInfo(counterparty), { signal: abort.signal }))
    } catch (err) {
      clearTimeout(timeout)
      shaker.write(FAIL)
      shaker.rest()
      return
    }

    const { stream: deliveryStream } = await conn.newStream([DELIVERY_REGISTER])

    clearTimeout(timeout)

    const relayShaker = handshake(deliveryStream)

    relayShaker.write(connection.remotePeer.pubKey.marshal())

    let answer = (await relayShaker.read())?.slice()

    if (u8aEquals(answer, OK)) {
      shaker.write(OK)
    } else {
      log(`Could not relay to peer ${counterparty.toB58String()} because we are unable to deliver packets.`)
      shaker.write(FAIL)
    }

    shaker.rest()
    relayShaker.rest()

    if (u8aEquals(answer, OK)) {
      pipe(shaker.stream, relayShaker.stream, shaker.stream)

      pipe(relayShaker.stream, shaker.stream, relayShaker.stream)
    }
  }

  handleWebRTC(srcBuffer: Pushable<Uint8Array>, sinkBuffer: Pushable<Uint8Array>): Promise<Connection> {
    return new Promise<Connection>(async (resolve, reject) => {
      let channel: SimplePeerInstance
      if (this._useOwnStunServers) {
        channel = new Peer({ wrtc, trickle: true, config: { iceServers: this.stunServers } })
      } else {
        channel = new Peer({ wrtc, trickle: true })
      }

      const done = (err?: Error, conn?: Connection) => {
        channel.removeListener('connect', onConnect)
        channel.removeListener('error', onError)
        channel.removeListener('signal', onSignal)

        srcBuffer.end()
        sinkBuffer.end()

        if (!err && !this._failIntentionallyOnWebRTC) {
          resolve(conn)
        }
      }

      const onSignal = (msg: string) => {
        sinkBuffer.push(this._encoder.encode(JSON.stringify(msg)))
      }

      const onConnect = async () => {
        log(`WebRTC counterparty connection established`)
        done(undefined, await this._upgrader.upgradeInbound(socketToConn((channel as unknown) as Socket)))
      }

      const onError = (err?: Error) => {
        done(err)
      }

      channel.on('signal', onSignal)
      channel.once('connect', onConnect)
      channel.once('error', onConnect)

      await pipe(
        /* prettier-ignore */
        srcBuffer,
        async (source: AsyncIterable<Uint8Array>) => {
          for await (const msg of source) {
            if (msg) {
              channel.signal(JSON.parse(this._decoder.decode(msg.slice())))
            }
          }
        }
      )
    })
  }

  /**
   * @async
   * @param {Multiaddr} ma
   * @param {object} options
   * @param {AbortSignal} options.signal Used to abort dial requests
   * @returns {Connection} An upgraded Connection
   */
  async dial(ma: Multiaddr, options?: DialOptions): Promise<Connection> {
    options = options || {}

    try {
      return await this.dialDirectly(ma, options)
    } catch (err) {
      const destination = PeerId.createFromCID(ma.getPeerId())

      if (this.relays === undefined) {
        throw Error(
          `Could not connect ${chalk.yellow(
            ma.toString()
          )} because there was no relay defined. Connection error was:\n${err}`
        )
      }

      // Check whether we know some relays that we can use
      const potentialRelays = this.relays?.filter((peerInfo: PeerInfo) => !peerInfo.id.isEqual(destination))

      if (potentialRelays == null || potentialRelays.length == 0) {
        throw Error(
          `Destination ${chalk.yellow(
            ma.toString()
          )} cannot be accessed and directly and there is no other relay node known. Connection error was:\n${err}`
        )
      }

      return await this.dialWithRelay(ma, potentialRelays, options)
    }
  }

  tryWebRTC(
    srcBuffer: Pushable<Uint8Array>,
    sinkBuffer: Pushable<Uint8Array>,
    counterparty: PeerId,
    options?: { signal: AbortSignal }
  ): Promise<Connection> {
    log(`Trying WebRTC with peer ${counterparty.toB58String()}`)

    return new Promise<Connection>(async (resolve, reject) => {
      let channel: SimplePeerInstance

      if (this._useOwnStunServers) {
        channel = new Peer({
          wrtc,
          initiator: true,
          trickle: true,
          config: { iceServers: this.stunServers },
        })
      } else {
        channel = new Peer({
          wrtc,
          initiator: true,
          trickle: true,
        })
      }

      const done = (err?: Error, conn?: Connection) => {
        channel.removeListener('connect', onConnect)
        channel.removeListener('error', onError)
        channel.removeListener('signal', onSignal)
        options.signal && options.signal.removeEventListener('abort', onAbort)

        srcBuffer.end()
        sinkBuffer.end()

        if (!err && !this._failIntentionallyOnWebRTC) {
          resolve(conn)
        }
      }

      const onAbort = () => {
        channel.destroy()
        setImmediate(reject)
      }

      const onSignal = (data: string): void => {
        sinkBuffer.push(this._encoder.encode(JSON.stringify(data)))
      }

      const onConnect = async (): Promise<void> => {
        log(`WebRTC connection with ${counterparty.toB58String()} was successful`)
        done(undefined, await this._upgrader.upgradeOutbound(socketToConn((channel as unknown) as Socket)))
      }

      const onError = (err?: Error) => {
        log(`WebRTC with peer ${counterparty.toB58String()} failed. Error was: ${err}`)
        done(err)
      }

      channel.on('signal', onSignal)

      channel.once('error', onError)

      channel.once('connect', onConnect)

      await pipe(
        /* prettier-ignore */
        srcBuffer,
        async (source: AsyncIterable<Uint8Array>) => {
          for await (const msg of source) {
            if (msg) {
              channel.signal(JSON.parse(this._decoder.decode(msg.slice())))
            }
          }
        }
      )
    })
  }

  async dialWithRelay(ma: Multiaddr, relays: PeerInfo[], options?: DialOptions): Promise<Connection> {
    const destination = PeerId.createFromCID(ma.getPeerId())

    let [relayConnection, index] = await Promise.race(
      relays.map(async (relay: PeerInfo, index: number): Promise<[Connection, number]> => [
        this._registrar.getConnection(relay) || (await this._dialer.connectToPeer(relay, { signal: options?.signal })),
        index
      ])
    )

    if (!relayConnection) {
      throw Error(
        `Unable to establish a connection to any known relay node. Tried ${chalk.yellow(
          relays.map((relay: PeerInfo) => relay.id.toB58String()).join(`, `)
        )}`
      )
    }

    const { stream } = await relayConnection.newStream([RELAY_REGISTER])

    const shaker = handshake(stream)

    shaker.write(destination.pubKey.marshal())

    let answer = (await shaker.read())?.slice()

    shaker.rest()

    if (!u8aEquals(answer, OK)) {
      throw Error(
        `Could not establish relayed connection to ${chalk.blue(destination.toB58String())} over relay ${relays[index].id.toB58String()}`
      )
    }

    let conn: Connection

    const sinkBuffer = pushable<Uint8Array>()
    const srcBuffer = pushable<Uint8Array>()

    const myStream = {
      sink: (source: AsyncIterable<Uint8Array>) => {
        shaker.stream.sink(
          (async function* () {
            for await (const msg of sinkBuffer) {
              yield new bl([new Uint8Array([WEBRTC_TRAFFIC_PREFIX]), msg])
            }
            for await (const msg of source) {
              yield new bl([new Uint8Array([REMAINING_TRAFFIC_PREFIX]), msg])
            }
          })()
        )
      },
      source: (async function* () {
        for await (const msg of shaker.stream.source) {
          if (msg.slice(0, 1)[0] == REMAINING_TRAFFIC_PREFIX) {
            yield msg.slice(1)
          } else if (msg.slice(0, 1)[0] == WEBRTC_TRAFFIC_PREFIX) {
            srcBuffer.push(msg.slice(1))
          }
        }
      })(),
    }

    const relayConn = {
      stream: myStream,
      counterparty: destination,
      relay: relayConnection.remotePeer,
    }

    if (this._useWebRTC) {
      setTimeout(() => {
        sinkBuffer.end()
        srcBuffer.end()
      }, WEBRTC_TIMEOUT)
      conn = await Promise.race([
        this.tryWebRTC(srcBuffer, sinkBuffer, destination, { signal: options.signal }),
        this._upgrader.upgradeOutbound(this.relayToConn(relayConn)),
      ])
    } else {
      sinkBuffer.end()
      srcBuffer.end()
      conn = await this._upgrader.upgradeOutbound(this.relayToConn(relayConn))
    }

    return conn
  }

  async dialDirectly(ma: Multiaddr, options?: DialOptions): Promise<Connection> {
    log(`[${chalk.blue(this._peerInfo.id.toB58String())}] dailing ${chalk.yellow(ma.toString())} directly`)
    const socket = await this._connect(ma, options)
    const maConn = socketToConn(socket, { remoteAddr: ma, signal: options.signal })

    log('new outbound connection %s', maConn.remoteAddr)
    const conn = await this._upgrader.upgradeOutbound(maConn)

    log('outbound connection %s upgraded', maConn.remoteAddr)
    return conn
  }

  /**
   * @private
   * @param {Multiaddr} ma
   * @param {object} options
   * @param {AbortSignal} options.signal Used to abort dial requests
   * @returns {Promise<Socket>} Resolves a TCP Socket
   */
  _connect(ma: Multiaddr, options: DialOptions): Promise<Socket> {
    if (options.signal && options.signal.aborted) {
      throw new AbortError()
    }

    return new Promise<Socket>((resolve, reject) => {
      const start = Date.now()
      const cOpts = multiaddrToNetConfig(ma) as any

      log('dialing %j', cOpts)
      const rawSocket = net.connect(cOpts)

      const onError = (err: Error) => {
        err.message = `connection error ${cOpts.host}:${cOpts.port}: ${err.message}`
        done(err)
      }

      const onTimeout = () => {
        log('connnection timeout %s:%s', cOpts.host, cOpts.port)
        const err = errCode(new Error(`connection timeout after ${Date.now() - start}ms`), 'ERR_CONNECT_TIMEOUT')
        // Note: this will result in onError() being called
        rawSocket.emit('error', err)
      }

      const onConnect = () => {
        log('connection opened %j', cOpts)
        done()
      }

      const onAbort = () => {
        log('connection aborted %j', cOpts)
        rawSocket.destroy()
        done(new AbortError())
      }

      const done = (err?: Error) => {
        rawSocket.removeListener('error', onError)
        rawSocket.removeListener('timeout', onTimeout)
        rawSocket.removeListener('connect', onConnect)
        options.signal && options.signal.removeEventListener('abort', onAbort)

        if (err) return reject(err)
        resolve(rawSocket)
      }

      rawSocket.on('error', onError)
      rawSocket.on('timeout', onTimeout)
      rawSocket.on('connect', onConnect)
      options.signal && options.signal.addEventListener('abort', onAbort)
    })
  }

  /**
   * Creates a TCP listener. The provided `handler` function will be called
   * anytime a new incoming Connection has been successfully upgraded via
   * `upgrader.upgradeInbound`.
   * @param {*} [options]
   * @param {function(Connection)} handler
   * @returns {Listener} A TCP listener
   */
  createListener(options: any, handler: (connection: any) => void): Listener {
    if (typeof options === 'function') {
      handler = options
      options = {}
    }
    options = options || {}

    this.connHandler = handler

    return createListener({ handler, upgrader: this._upgrader }, options)
  }

  /**
   * Takes a list of `Multiaddr`s and returns only valid TCP addresses
   * @param multiaddrs
   * @returns Valid TCP multiaddrs
   */
  filter(multiaddrs: Multiaddr[]): Multiaddr[] {
    multiaddrs = Array.isArray(multiaddrs) ? multiaddrs : [multiaddrs]

    return multiaddrs.filter(ma => {
      return mafmt.TCP.matches(ma.decapsulateCode(CODE_P2P)) || mafmt.P2P.matches(ma)
    })
  }
}

function streamToPrefixStream(stream: Stream, prefix: number) {
  return {
    sink: (source: AsyncIterable<Uint8Array>) => {
      stream.sink(
        (async function* () {
          for await (const msg of source) {
            yield new bl([new Uint8Array([prefix]), msg])
          }
        })()
      )
    },
    source: (async function* () {
      for await (const msg of stream.source) {
        if (msg.slice(0, 1)[0] == prefix) {
          yield msg.slice(1)
        }
      }
    })(),
  }
}

export default TCP
