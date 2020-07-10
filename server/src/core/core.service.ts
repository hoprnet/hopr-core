import * as path from "path"
import { Injectable } from '@nestjs/common'
import { default as connector } from '@hoprnet/hopr-core-ethereum'
import Hopr from '@hoprnet/hopr-core'
import type { HoprOptions } from '@hoprnet/hopr-core'
import type HoprCoreConnector from '@hoprnet/hopr-core-connector-interface'
import { ParserService } from './parser/parser.service'
import PeerInfo from 'peer-info'
import readPkg from "read-pkg-up"

export type StartOptions = {
  debug?: boolean
  id?: number
  bootstrapNode?: boolean
  host?: string
  bootstrapServers?: string[]
}

@Injectable()
export class CoreService {
  private node: Hopr<HoprCoreConnector>
  private readonly pkg = readPkg.sync().packageJson
  private readonly nodePkg = readPkg.sync({
    cwd: path.join(__dirname, "..", "..", "node_modules", "@hoprnet/hopr-core")
  }).packageJson

  constructor(private parserService: ParserService) { }

  get started(): boolean {
    return typeof this.node !== "undefined"
  }

  // @TODO: handle if already started
  async start(customOptions?: StartOptions): Promise<void> {
    const options: HoprOptions = {
      id: customOptions.id,
      debug: customOptions.debug ?? true,
      bootstrapNode: customOptions.bootstrapNode ?? false,
      network: 'ethereum',
      connector,
      bootstrapServers: await Promise.all<PeerInfo>(
        (
          customOptions.bootstrapServers ?? [
            '/ip4/34.65.114.152/tcp/9091/p2p/16Uiu2HAmQrtY26aYgLBUMjhw9qvZABKYTdncHR5VD4MDrMLVSpkp',
          ]
        ).map((multiaddr) => this.parserService.parseBootstrap(multiaddr) as Promise<PeerInfo>),
      ),
      provider: 'wss://kovan.infura.io/ws/v3/f7240372c1b442a6885ce9bb825ebc36',
      hosts: (await this.parserService.parseHost(customOptions.host ?? '0.0.0.0:9091')) as HoprOptions['hosts'],
      password: 'switzerland',
      output: this.parserService.outputFunctor(),
    }
    console.log(':: HOPR Options ::', options)
    console.log(':: Starting HOPR Core Node ::')
    this.node = await Hopr.create(options)
    console.log(':: HOPR Core Node Started ::')
  }

  // @TODO: handle if already stopped
  async stop(): Promise<{ timestamp: number }> {
    console.log(':: Stopping HOPR Core Node ::')
    await this.node.stop()
    this.node = undefined
    console.log(':: HOPR Core Node Stopped ::')
    return {
      timestamp: +new Date()
    }
  }

  // @TODO: catch error?
  async getStatus(): Promise<
    {
      id: string
      multiAddresses: string[]
      connectedNodes: number
    }
  > {
    // @TODO: turn this into a decorator
    if (!this.started) {
      throw Error('HOPR node is not started')
    }

    const id = this.node.peerInfo.id.toB58String()
    const multiAddresses = this.node.peerInfo.multiaddrs.toArray().map((multiaddr) => multiaddr.toString())

    // @TODO: maybe do a crawl before getting length
    const connectedNodes = this.node.network.peerStore.peers.length

    return {
      id,
      multiAddresses,
      connectedNodes,
    }
  }

  // @TODO: version should be put into a different service
  async getVersions(): Promise<{
    hoprServer: string
    hoprCore: string
    hoprCoreConnectorInterface: string
    hoprCoreEthereum: string
    hoprUtils: string
  }> {
    console.log(this.pkg.version)

    const hoprServer = this.pkg.version
    const hoprCore = this.nodePkg.version
    const hoprCoreConnectorInterface = this.nodePkg.dependencies["@hoprnet/hopr-core-connector-interface"]
    const hoprCoreEthereum = this.nodePkg.dependencies["@hoprnet/hopr-core-ethereum"]
    const hoprUtils = this.nodePkg.dependencies["@hoprnet/hopr-utils"]

    return {
      hoprServer,
      hoprCore,
      hoprCoreConnectorInterface,
      hoprCoreEthereum,
      hoprUtils
    }
  }
}
