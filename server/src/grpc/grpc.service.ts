import { Injectable } from '@nestjs/common'
import { CoreService } from '../core/core.service'
import { StatusResponse } from '@hoprnet/hopr-protos/node/status_pb'
import { VersionResponse } from '@hoprnet/hopr-protos/node/version_pb'
import { ShutdownResponse } from '@hoprnet/hopr-protos/node/shutdown_pb'

// @TODO: maybe we don't need another service
@Injectable()
export class GrpcService {
  constructor(private coreService: CoreService) {}

  async getStatus(): Promise<StatusResponse.AsObject> {
    return this.coreService.getStatus().then((res) => ({
      id: res.id,
      multiAddressesList: res.multiAddresses,
      connectedNodes: res.connectedNodes,
      cpuUsage: 0, // @TODO: create a module for monitoring the node
    }))
  }

  async getVersion(): Promise<VersionResponse.AsObject> {
    return this.coreService.getVersions().then((res) => ({
      version: res.hoprServer,
      componentsVersionMap: [
        ['@hoprnet/hopr-core', res.hoprCore],
        ['@hoprnet/hopr-core-connector-interface', res.hoprCoreConnectorInterface],
        ['@hoprnet/hopr-core-ethereum', res.hoprCoreEthereum],
        ['@hoprnet/hopr-utils', res.hoprUtils],
        ['@hoprnet/hopr-core-connector-interface', res.hoprCoreConnectorInterface],
      ],
    }))
  }

  async shutdown(): Promise<ShutdownResponse.AsObject> {
    return this.coreService.stop()
  }
}
