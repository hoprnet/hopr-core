import { Test, TestingModule } from '@nestjs/testing'
import { CoreModule } from '../core/core.module'
import { ApiService } from './api.service'

describe('ApiService', () => {
  let service: ApiService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CoreModule],
      providers: [ApiService],
    }).compile()

    service = module.get<ApiService>(ApiService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
