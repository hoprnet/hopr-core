import { Injectable } from '@nestjs/common'
import { default as connector } from '@hoprnet/hopr-core-ethereum'
import Hopr from '@hoprnet/hopr-core'
import type { HoprOptions } from '@hoprnet/hopr-core'
import type HoprCoreConnector from '@hoprnet/hopr-core-connector-interface'
import { ParserService } from './parser/parser.service'
import PeerInfo from 'peer-info'

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

  constructor(private parserService: ParserService) {}

  get started(): boolean {
    return !!this.node
  }

  // @TODO: handle if already starting
  async start(customOptions?: StartOptions): Promise<void> {
    if (this.started) return

    const options: HoprOptions = {
      id: customOptions.id,
      debug: customOptions.debug ?? true,
      bootstrapNode: customOptions.bootstrapNode ?? false,
      network: 'ethereum',
      connector,
      bootstrapServers: await Promise.all<PeerInfo>(
        (
          customOptions.bootstrapServers ?? [
            '/ip4/34.65.177.154/tcp/9091/p2p/16Uiu2HAm4FcroWGzc9yhDAsKSGC8W9yoDKiQBnAGK5aQdqJWmior',
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

  // @TODO: handle if already stopping
  async stop(): Promise<{ timestamp: number }> {
    if (!this.started) return

    console.log(':: Stopping HOPR Core Node ::')
    await this.node.stop()
    this.node = undefined
    console.log(':: HOPR Core Node Stopped ::')
    return {
      timestamp: +new Date(),
    }
  }

  async getStatus(): Promise<{
    id: string
    multiAddresses: string[]
    connectedNodes: number
  }> {
    // @TODO: turn this into a decorator
    if (!this.started) {
      throw Error('HOPR node is not started')
    }

    try {
      // @TODO: cache this result
      await this.node.network.crawler.crawl()
    } catch {}

    const id = this.node.peerInfo.id.toB58String()
    const multiAddresses = this.node.peerInfo.multiaddrs.toArray().map((multiaddr) => multiaddr.toString())

    const connectedNodes = this.node.network.peerStore.peers.length

    return {
      id,
      multiAddresses,
      connectedNodes,
    }
  }
}
