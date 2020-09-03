// @ts-ignore
import libp2p = require('libp2p')
// @ts-ignore
import MPLEX = require('libp2p-mplex')
// @ts-ignore
import KadDHT = require('libp2p-kad-dht')
// @ts-ignore
import SECIO = require('libp2p-secio')

import TCP from './network/transport'

import { Packet } from './messages/packet'
import { PACKET_SIZE, MAX_HOPS } from './constants'

import { Network } from './network'

import { addPubKey, getPeerInfo, pubKeyToPeerId } from './utils'
import { createDirectoryIfNotExists, u8aToHex } from '@hoprnet/hopr-utils'

import levelup, { LevelUp } from 'levelup'
import leveldown from 'leveldown'
import Multiaddr from 'multiaddr'
import chalk from 'chalk'

import Debug from 'debug'
const log = Debug(`hopr-core`)

import PeerId from 'peer-id'
import PeerInfo from 'peer-info'

import { Handler } from './network/transport/types'

import type HoprCoreConnector from '@hoprnet/hopr-core-connector-interface'
import type { HoprCoreConnectorStatic } from '@hoprnet/hopr-core-connector-interface'
import HoprCoreEthereum from '@hoprnet/hopr-core-ethereum'

import { Interactions } from './interactions'
import * as DbKeys from './dbKeys'

interface NetOptions {
  ip: string
  port: number
}

export type HoprOptions = {
  debug: boolean
  db?: LevelUp
  peerId?: PeerId
  peerInfo?: PeerInfo
  password?: string
  id?: number
  bootstrapNode?: boolean
  network: string
  connector?: HoprCoreConnectorStatic
  bootstrapServers?: PeerInfo[]
  provider: string
  output?: (encoded: Uint8Array) => void
  hosts?: {
    ip4?: NetOptions
    ip6?: NetOptions
  }
}

const MAX_ITERATIONS_PATH_SELECTION = 2000

export default class Hopr<Chain extends HoprCoreConnector> extends libp2p {
  public interactions: Interactions<Chain>
  public network: Network<Chain>
  public dbKeys = DbKeys
  public output: (arr: Uint8Array) => void
  public isBootstrapNode: boolean
  public bootstrapServers: PeerInfo[]

  // @TODO add libp2p types
  declare emit: (event: string, ...args: any[]) => void
  declare dial: (addr: Multiaddr | PeerInfo | PeerId, options?: { signal: AbortSignal }) => Promise<Handler>
  declare dialProtocol: (
    addr: Multiaddr | PeerInfo | PeerId,
    protocol: string,
    options?: { signal: AbortSignal }
  ) => Promise<Handler>
  declare hangUp: (addr: PeerInfo | PeerId | Multiaddr | string) => Promise<void>
  declare peerInfo: PeerInfo
  declare peerStore: {
    has(peerInfo: PeerId): boolean
    get(peerId: PeerId): PeerInfo | undefined
    put(peerInfo: PeerInfo, options?: { silent: boolean }): PeerInfo
    peers: Map<string, PeerInfo>
    remove(peer: PeerId): void
  }
  declare peerRouting: {
    findPeer: (addr: PeerId) => Promise<PeerInfo>
  }
  declare handle: (protocol: string[], handler: (struct: { connection: any; stream: any }) => void) => void
  declare on: (str: string, handler: (...props: any[]) => void) => void

  /**
   * @constructor
   *
   * @param _options
   * @param provider
   */
  constructor(options: HoprOptions, public db: LevelUp, public paymentChannels: Chain) {
    super({
      peerInfo: options.peerInfo,

      // Disable libp2p-switch protections for the moment
      switch: {
        denyTTL: 1,
        denyAttempts: Infinity,
      },
      // The libp2p modules for this libp2p bundle
      modules: {
        transport: [TCP],
        streamMuxer: [MPLEX],
        connEncryption: [SECIO],
        dht: KadDHT,
      },
      config: {
        transport: {
          TCP: {
            bootstrapServers: options.bootstrapServers,
          },
        },
        dht: {
          enabled: true,
        },
        relay: {
          enabled: false,
        },
      },
    })

    this.output = options.output || console.log
    this.bootstrapServers = options.bootstrapServers || []
    this.isBootstrapNode = options.bootstrapNode || false

    this.interactions = new Interactions(this)
    this.network = new Network(this, options)
  }

  /**
   * Creates a new node.
   *
   * @param options the parameters
   */
  static async create<CoreConnector extends HoprCoreConnector>(options: HoprOptions): Promise<Hopr<CoreConnector>> {
    const Connector = options.connector ?? HoprCoreEthereum
    const db = options.db || Hopr.openDatabase(`db`, Connector.constants, options)

    options.peerInfo = options.peerInfo || (await getPeerInfo(options, db))

    if (
      !options.debug &&
      !options.bootstrapNode &&
      (options.bootstrapServers == null || options.bootstrapServers.length == 0)
    ) {
      throw Error(`Cannot start node without a bootstrap server`)
    }

    let connector = (await Connector.create(db, options.peerInfo.id.privKey.marshal(), {
      provider: options.provider,
      debug: options.debug,
    })) as CoreConnector

    return await new Hopr<CoreConnector>(options, db, connector).start()
  }

  /**
   * Parses the bootstrap servers given in `.env` and tries to connect to each of them.
   *
   * @throws an error if none of the bootstrapservers is online
   */
  async connectToBootstrapServers(): Promise<void> {
    const potentialBootstrapServers = this.bootstrapServers.filter(
      (addr: PeerInfo) => !addr.id.equals(this.peerInfo.id)
    )

    if (potentialBootstrapServers.length == 0) {
      if (!this.isBootstrapNode) {
        throw Error(
          `Can't start HOPR without any known bootstrap server. You might want to start this node as a bootstrap server.`
        )
      }

      return
    }

    const results = await Promise.all(
      potentialBootstrapServers.map((addr: PeerInfo) =>
        this.dial(addr).then(
          () => true,
          () => false
        )
      )
    )

    if (!results.some((online: boolean) => online)) {
      throw Error('Unable to connect to any known bootstrap server.')
    }
  }

  /**
   * This method starts the node and registers all necessary handlers. It will
   * also open the database and creates one if it doesn't exists.
   *
   * @param options
   */
  async start(): Promise<Hopr<Chain>> {
    await Promise.all([
      super.start().then(() =>
        Promise.all([
          // prettier-ignore
          this.connectToBootstrapServers(),
          this.network.start(),
        ])
      ),
      this.paymentChannels?.start(),
    ])

    log(`Available under the following addresses:`)

    this.peerInfo.multiaddrs.forEach((ma: Multiaddr) => log(ma.toString()))

    return this
  }

  /**
   * Shuts down the node and saves keys and peerBook in the database
   */
  async stop(): Promise<void> {
    await this.db?.close()

    log(`Database closed.`)

    await this.network.stop()

    await this.paymentChannels?.stop()

    log(`Connector stopped.`)

    await super.stop()
  }

  /**
   * Sends a message.
   *
   * @notice THIS METHOD WILL SPEND YOUR ETHER.
   * @notice This method will fail if there are not enough funds to open
   * the required payment channels. Please make sure that there are enough
   * funds controlled by the given key pair.
   *
   * @param msg message to send
   * @param destination PeerId of the destination
   * @param intermediateNodes optional set path manually
   * the acknowledgement of the first hop
   */
  async sendMessage(
    msg: Uint8Array,
    destination: PeerId,
    getIntermediateNodesManually?: () => Promise<PeerId[]>
  ): Promise<void> {
    const promises: Promise<void>[] = []

    for (let n = 0; n < msg.length / PACKET_SIZE; n++) {
      promises.push(
        new Promise<void>(async (resolve, reject) => {
          let path: PeerId[]
          if (getIntermediateNodesManually != undefined) {
            path = await getIntermediateNodesManually()
          } else {
            path = await this.getIntermediateNodes(destination)
          }

          path.push(destination)

          let packet: Packet<Chain>
          try {
            packet = await Packet.create(
              /* prettier-ignore */
              this,
              msg.slice(n * PACKET_SIZE, Math.min(msg.length, (n + 1) * PACKET_SIZE)),
              await Promise.all(path.map(addPubKey))
            )
          } catch (err) {
            return reject(err)
          }

          const unAcknowledgedDBKey = this.dbKeys.UnAcknowledgedTickets(path[0].pubKey.marshal(), packet.challenge.hash)

          await this.db.put(Buffer.from(unAcknowledgedDBKey), Buffer.from(''))

          this.interactions.packet.acknowledgment.once(u8aToHex(unAcknowledgedDBKey), () => {
            resolve()
          })

          try {
            await this.interactions.packet.forward.interact(path[0], packet)
          } catch (err) {
            return reject(err)
          }
        })
      )
    }

    try {
      await Promise.all(promises)
    } catch (err) {
      log(`Could not send message. Error was: ${chalk.red(err.message)}`)
      throw err
    }
  }

  /**
   * Ping a node.
   *
   * @param destination PeerId of the node
   * @returns latency
   */
  async ping(destination: PeerId): Promise<number> {
    if (!PeerId.isPeerId(destination)) {
      throw Error(`Expecting a non-empty destination.`)
    }

    const start = Date.now()
    try {
      await this.interactions.network.heartbeat.interact(destination)
      return Date.now() - start
    } catch (err) {
      throw Error(`node unreachable`)
    }
  }

  /**
   * Takes a destination and samples randomly intermediate nodes
   * that will relay that message before it reaches its destination.
   *
   * @param destination instance of peerInfo that contains the peerId of the destination
   */
  async getIntermediateNodes(destination: PeerId): Promise<PeerId[]> {
    const start = new this.paymentChannels.types.Public(this.peerInfo.id.pubKey.marshal())
    const exclude = [
      destination.pubKey.marshal(),
      ...this.bootstrapServers.map((pInfo) => pInfo.id.pubKey.marshal()),
    ].map((pubKey) => new this.paymentChannels.types.Public(pubKey))

    return await Promise.all(
      (
        await this.paymentChannels.path.findPath(
          start,
          MAX_HOPS,
          MAX_ITERATIONS_PATH_SELECTION,
          (node) => !exclude.includes(node)
        )
      ).map((pubKey) => pubKeyToPeerId(pubKey))
    )
  }

  static openDatabase(
    db_dir: string,
    constants: { CHAIN_NAME: string; NETWORK: string },
    options?: { id?: number; bootstrapNode?: boolean }
  ): LevelUp {
    db_dir += `/${constants.CHAIN_NAME}/${constants.NETWORK}/`

    if (options != null && options.bootstrapNode) {
      db_dir += `bootstrap`
    } else if (options != null && options.id != null && Number.isInteger(options.id)) {
      // For testing ...
      db_dir += `node_${options.id}`
    } else {
      db_dir += `node`
    }

    createDirectoryIfNotExists(`${process.cwd()}/${db_dir}`)

    return levelup(leveldown(db_dir))
  }
}
