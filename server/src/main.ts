import { join } from 'path'
import { NestFactory } from '@nestjs/core'
import { Transport, MicroserviceOptions } from '@nestjs/microservices'
import { AppModule } from './app.module'

// @TODO: we could expose this data from @hoprnet/hopr-protos
const packages = ['status', 'version']
const HOPR_PROTOS_DIR = join(__dirname, '..', 'node_modules', '@hoprnet/hopr-protos', 'protos')

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      // @TODO: make this configurable
      url: '0.0.0.0:50051',
      package: packages,
      protoPath: packages.map((pkg) => `${pkg}.proto`),
      loader: {
        includeDirs: [HOPR_PROTOS_DIR],
      },
    },
  })

  app.listen(() => 'GRPC Service is listening')
}

bootstrap()
