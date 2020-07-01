import { Module } from '@nestjs/common';
import { ParserService } from './parser/parser.service';
import { CoreService } from './core.service';
import { CoreController } from './core.controller';

@Module({
  providers: [ParserService, CoreService],
  controllers: [CoreController],
})
export class CoreModule {}
