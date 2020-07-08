import { join } from 'path'
import { Test } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import { Transport } from '@nestjs/microservices'
import * as grpc from 'grpc'
import { AppModule } from './../src/app.module'
import { CoreService } from './../src/core/core.service'
import { StatusRequest } from '@hoprnet/hopr-protos/node/status_pb'
import { StatusClient } from '@hoprnet/hopr-protos/node/status_grpc_pb'

const packages = ['status', 'version']
const HOPR_PROTOS_DIR = join(__dirname, '..', 'node_modules', '@hoprnet/hopr-protos', 'protos')

describe('GRPC transport', () => {
  let bootstrapApp: INestApplication
  let bootstrapCoreService: CoreService
  const bootstrapMultiaddrs: string[] = [
    '/ip4/127.0.0.1/tcp/9090/p2p/16Uiu2HAmNqLm83bwMq9KQEZEWHcbsHQfBkbpZx4eVSoDG4Mp6yfX',
  ]

  let app: INestApplication
  let coreService: CoreService
  let statusClient: StatusClient

  // initialize bootstrap node
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    bootstrapApp = module.createNestApplication()
    await bootstrapApp.init()
    bootstrapCoreService = bootstrapApp.get<CoreService>(CoreService)

    await bootstrapCoreService.start({
      debug: true,
      // if you change this, you need to update bootstrapMultiaddrs
      id: 1,
      bootstrapNode: true,
      host: '0.0.0.0:9090',
    })
  })

  // initialize new node on every test
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = module.createNestApplication()

    app.connectMicroservice({
      transport: Transport.GRPC,
      options: {
        url: '0.0.0.0:50051',
        package: packages,
        protoPath: packages.map((pkg) => `${pkg}.proto`),
        loader: {
          includeDirs: [HOPR_PROTOS_DIR],
        },
      },
    })

    // Start gRPC microservice
    await app.startAllMicroservicesAsync()
    await app.init()

    coreService = app.get<CoreService>(CoreService)
    statusClient = new StatusClient('localhost:50051', grpc.credentials.createInsecure())
  })

  it('getStatus', async (done) => {
    await expect(
      coreService.start({
        bootstrapServers: bootstrapMultiaddrs,
      }),
    ).resolves.toEqual({
      status: 'ok',
    })

    statusClient.getStatus(new StatusRequest(), (err, res) => {
      expect(err).toBeFalsy()
      expect(res).toBeTruthy()
      done()
    })
  })

  afterEach(async () => {
    await app.close()
    statusClient.close()
  })
})
