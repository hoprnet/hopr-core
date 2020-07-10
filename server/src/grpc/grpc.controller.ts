import { Controller } from '@nestjs/common'
import { GrpcMethod, RpcException } from '@nestjs/microservices'
import { status as STATUS } from "grpc"
import { GrpcService } from './grpc.service'
import { StatusResponse } from '@hoprnet/hopr-protos/node/status_pb'
import { VersionResponse } from '@hoprnet/hopr-protos/node/version_pb'
import { ShutdownResponse } from '@hoprnet/hopr-protos/node/shutdown_pb'

// @TODO: capture errors and turn them into GRPC errors
@Controller('grpc')
export class GrpcController {
  constructor(private grpcService: GrpcService) { }

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

  @GrpcMethod('Version')
  async getVersion(): Promise<VersionResponse.AsObject> {
    try {
      return this.grpcService.getVersion()
    } catch (err) {
      throw new RpcException({
        code: STATUS.INTERNAL,
        message: err
      })
    }
  }

  @GrpcMethod('Shutdown')
  async shutdown(): Promise<ShutdownResponse.AsObject> {
    try {
      return this.grpcService.shutdown()
    } catch (err) {
      throw new RpcException({
        code: STATUS.INTERNAL,
        message: err
      })
    }
  }
}
