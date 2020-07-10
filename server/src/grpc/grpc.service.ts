import { Injectable } from '@nestjs/common'
import { CoreService } from '../core/core.service'
import { StatusResponse } from '@hoprnet/hopr-protos/node/status_pb'

// @TODO: maybe we don't need another service
@Injectable()
export class GrpcService {
  constructor(private coreService: CoreService) { }

  async getStatus(): Promise<StatusResponse.AsObject> {
    return this.coreService
      .getStatus().then(res => ({
        id: res.id,
        multiAddressesList: res.multiAddresses,
        connectedNodes: res.connectedNodes,
        cpuUsage: 0 // @TODO: create a module for monitoring the node
      }))
  }
}
