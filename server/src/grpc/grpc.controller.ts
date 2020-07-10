import { Controller } from '@nestjs/common'
import { GrpcMethod, RpcException } from '@nestjs/microservices'
import { status as STATUS } from "grpc"
import { GrpcService } from './grpc.service'
import { StatusResponse } from '@hoprnet/hopr-protos/node/status_pb'

@Controller('grpc')
export class GrpcController {
  constructor(private grpcService: GrpcService) { }

  // @TODO: capture errors and turn them into GRPC errors
  @GrpcMethod('Status')
  async getStatus(): Promise<StatusResponse.AsObject> {
    try {
      return this.grpcService.getStatus()
    } catch (err) {
      throw new RpcException({
        code: STATUS.INTERNAL,
        message: err
      })
    }
  }
}
