import { Module } from '@nestjs/common'
import { ParserService } from './parser/parser.service'
import { CoreService } from './core.service'

@Module({
  providers: [ParserService, CoreService],
  exports: [CoreService]
})
export class CoreModule {
  constructor(private coreService: CoreService) { }

  async onModuleDestroy() {
    await this.coreService.stop()
  }
}
