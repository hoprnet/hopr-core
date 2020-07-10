import { Test, TestingModule } from '@nestjs/testing'
import { ApiModule } from "../api/api.module"
import { GrpcController } from './grpc.controller'
import { GrpcService } from './grpc.service'

describe('Grpc Controller', () => {
  let controller: GrpcController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ApiModule],
      providers: [GrpcService],
      controllers: [GrpcController],
    }).compile()

    controller = module.get<GrpcController>(GrpcController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
