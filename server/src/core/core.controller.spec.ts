import { Test, TestingModule } from '@nestjs/testing'
import { CoreController } from './core.controller'
import { CoreService } from './core.service'
import { ParserService } from './parser/parser.service'

describe('Core Controller', () => {
  let controller: CoreController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CoreService, ParserService],
      controllers: [CoreController],
    }).compile()

    controller = module.get<CoreController>(CoreController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
