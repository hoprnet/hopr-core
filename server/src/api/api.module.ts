import { Module } from '@nestjs/common'
import { CoreModule } from "../core/core.module"
import { ApiService } from "./api.service"

@Module({
  imports: [CoreModule],
  providers: [ApiService],
  exports: [ApiService]
})
export class ApiModule {
  constructor() { }
}
