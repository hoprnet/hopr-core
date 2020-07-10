import { Controller } from '@nestjs/common'
import { GrpcMethod } from '@nestjs/microservices'
import { GrpcService } from './grpc.service'
import { StatusResponse } from '@hoprnet/hopr-protos/node/status_pb'

@Controller('grpc')
export class GrpcController {
  constructor(private grpcService: GrpcService) { }

  // @TODO: capture errors and turn them into GRPC errors
  @GrpcMethod('Status')
  async getStatus(): Promise<StatusResponse.AsObject> {
    return this.grpcService.getStatus()
  }
}
