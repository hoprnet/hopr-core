import { Injectable } from '@nestjs/common'
import { ApiService } from '../api/api.service'
import { StatusResponse } from '@hoprnet/hopr-protos/node/status_pb'

// @TODO: maybe we don't need another service
@Injectable()
export class GrpcService {
  constructor(private apiService: ApiService) { }

  async getStatus(): Promise<StatusResponse.AsObject> {
    return this.apiService
      .status().then(res => ({
        id: res.id,
        multiAddressesList: res.multiAddresses,
        connectedNodes: res.connectedNodes,
        cpuUsage: res.cpuUsage
      }))
  }
}
