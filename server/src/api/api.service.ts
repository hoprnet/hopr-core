import { Injectable } from '@nestjs/common'
import { CoreService } from '../core/core.service'

@Injectable()
export class ApiService {
  constructor(private coreService: CoreService) { }

  // @TODO: catch error?
  async status(): Promise<
    {
      id: string
      multiAddresses: string[]
      cpuUsage: number
      connectedNodes: number
    }
  > {
    const { node, started } = this.coreService

    // @TODO: turn this into a decorator
    if (!started) {
      throw Error('HOPR node is not started')
    }

    const id = node.peerInfo.id.toB58String()
    const multiAddresses = node.peerInfo.multiaddrs.toArray().map((multiaddr) => multiaddr.toString())

    // @TODO: maybe do a crawl before getting length
    const connectedNodes = node.network.peerStore.peers.length

    return {
      id,
      multiAddresses,
      // @TODO: get true cpu usage
      cpuUsage: 0,
      connectedNodes,
    }
  }
}
