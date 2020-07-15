import { Injectable } from '@nestjs/common'
import { CoreService } from '../core/core.service'
import { SystemService } from '../system/system.service'
import { StatusResponse } from '@hoprnet/hopr-protos/node/status_pb'
import { VersionResponse } from '@hoprnet/hopr-protos/node/version_pb'
import { ShutdownResponse } from '@hoprnet/hopr-protos/node/shutdown_pb'
import { PingResponse } from '@hoprnet/hopr-protos/node/ping_pb'
import { GetNativeAddressResponse, GetHoprAddressResponse } from '@hoprnet/hopr-protos/node/address_pb'
import { GetNativeBalanceResponse, GetHoprBalanceResponse } from '@hoprnet/hopr-protos/node/balance_pb'

@Injectable()
export class GrpcService {
  constructor(private coreService: CoreService, private systemService: SystemService) {}

  async getStatus(): Promise<StatusResponse.AsObject> {
    // @TODO: currently types generated by protoc are incompatible
    // @ts-ignore
    return this.coreService.getStatus().then(res => ({
      id: res.id,
      multiAddresses: res.multiAddresses,
      connectedNodes: res.connectedNodes,
    }))
  }

  async getVersion(): Promise<VersionResponse.AsObject> {
    // @ts-ignore
    return this.systemService.getVersions().then((res) => ({
      version: res.hoprServer,
      componentsVersion: [
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

  async getPing(peerId: string): Promise<PingResponse.AsObject> {
    return this.coreService.getPing(peerId)
  }

  async getNativeBalance(): Promise<GetNativeBalanceResponse.AsObject> {
    return this.coreService.getBalance('native').then((res) => ({
      amount: res,
    }))
  }

  async getHoprBalance(): Promise<GetHoprBalanceResponse.AsObject> {
    return this.coreService.getBalance('hopr').then((res) => ({
      amount: res,
    }))
  }

  async getNativeAddress(): Promise<GetNativeAddressResponse.AsObject> {
    return this.coreService.getAddress('native').then((res) => ({
      address: res,
    }))
  }

  async getHoprAddress(): Promise<GetHoprAddressResponse.AsObject> {
    return this.coreService.getAddress('hopr').then((res) => ({
      address: res,
    }))
  }
}
