import { Test } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import { Transport } from '@nestjs/microservices'
import * as grpc from 'grpc'
import { StatusRequest } from '@hoprnet/hopr-protos/node/status_pb'
import { StatusClient } from '@hoprnet/hopr-protos/node/status_grpc_pb'
import { AppModule } from '../src/app.module'
import { CoreService } from '../src/core/core.service'
import { HOPR_PROTOS_DIR, PROTO_PACKAGES, PROTO_FILES } from "../src/constants"

// @TODO: fix open handles
describe('GRPC transport', () => {
  // if you change this, you need to update 'bootstrapMultiaddrs'
  const bootstrapId = 1
  const bootstrapMultiaddrs: string[] = [
    '/ip4/127.0.0.1/tcp/9090/p2p/16Uiu2HAmNqLm83bwMq9KQEZEWHcbsHQfBkbpZx4eVSoDG4Mp6yfX',
  ]
  let bootstrapApp: INestApplication
  let bootstrapCoreService: CoreService

  // if you change this, you need to update 'bootstrapMultiaddrs'
  const appId = 2
  const appPeerId = "16Uiu2HAmVDrWin9HmCc4sjx1zYzc8fGgTvXSvQS5sYb133mjrohb"
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
      id: bootstrapId,
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
        package: PROTO_PACKAGES,
        protoPath: PROTO_FILES,
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
        debug: true,
        id: appId,
        bootstrapServers: bootstrapMultiaddrs,
      }),
    ).resolves.toEqual({
      status: 'ok',
    })

    statusClient.getStatus(new StatusRequest(), (err, res) => {
      expect(err).toBeFalsy()

      const data = res.toObject()
      expect(data.id).toBe(appPeerId)
      expect(data.connectedNodes).toBe(1)

      done()
    })
  })

  afterEach(async () => {
    await app.close()
    statusClient.close()
  })

  afterAll(async () => {
    await bootstrapApp.close()
  })
})
