import { Controller, Post } from '@nestjs/common'
import { GrpcMethod } from '@nestjs/microservices'
import { CoreService } from './core.service'
import { StatusResponse } from '@hoprnet/hopr-protos/node/status_pb'

@Controller('core')
export class CoreController {
  constructor(private coreService: CoreService) {}

  @Post('start')
  async start(): Promise<string> {
    return this.coreService
      .start()
      .then((msg) => msg)
      .catch((err) => err)
  }

  @Post('stop')
  async stop(): Promise<string> {
    return this.coreService
      .stop()
      .then((msg) => msg)
      .catch((err) => err)
  }

  @GrpcMethod('Status')
  async getStatus(): Promise<StatusResponse.AsObject> {
    return this.coreService
      .status()
      .then((msg) => {
        return msg['data']
      })
      .catch((err) => err)
  }
}
