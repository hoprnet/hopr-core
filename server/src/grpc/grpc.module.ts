import { Module } from '@nestjs/common'
import { ApiModule } from "../api/api.module"
import { GrpcService } from "./grpc.service"
import { GrpcController } from "./grpc.controller"

@Module({
  imports: [ApiModule],
  providers: [GrpcService],
  controllers: [GrpcController],
})
export class GrpcModule { }
