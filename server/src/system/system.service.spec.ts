import { Test, TestingModule } from '@nestjs/testing'
import { ConfigModule } from '@nestjs/config'
import { SystemService } from './system.service'

describe('SystemService', () => {
  let service: SystemService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
      ],
      providers: [SystemService],
    }).compile()

    service = module.get<SystemService>(SystemService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
