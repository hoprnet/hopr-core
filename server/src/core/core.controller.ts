import { Controller, Post } from '@nestjs/common';
import { CoreService } from './core.service';

@Controller('core')
export class CoreController {
  constructor(private coreService: CoreService) {}

  @Post('start')
  async start(): Promise<string> {
    return this.coreService.start()
      .then((msg) => msg)
      .catch((err) => err)
  }

  @Post('stop')
  async stop(): Promise<string> {
    return this.coreService.stop()
      .then((msg) => msg)
      .catch((err) => err)
  }
}
