import { Module } from '@nestjs/common'
import { CoreModule } from '../core/core.module'
import { GrpcService } from './grpc.service'
import { GrpcController } from './grpc.controller'

@Module({
  imports: [CoreModule],
  providers: [GrpcService],
  controllers: [GrpcController],
})
export class GrpcModule {}
