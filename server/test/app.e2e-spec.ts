import { Test } from '@nestjs/testing'
import { ConfigModule } from '@nestjs/config'
import { INestApplication } from '@nestjs/common'
import { Transport } from '@nestjs/microservices'
import * as grpc from 'grpc'
import { AppModule } from '../src/app.module'
import { HOPR_PROTOS_FOLDER_DIR, PROTO_PACKAGES, PROTO_FILES } from '../src/constants'
import { VersionRequest } from '@hoprnet/hopr-protos/node/version_pb'
import { VersionClient } from '@hoprnet/hopr-protos/node/version_grpc_pb'
import { StatusRequest } from '@hoprnet/hopr-protos/node/status_pb'
import { StatusClient } from '@hoprnet/hopr-protos/node/status_grpc_pb'
import { ShutdownRequest } from '@hoprnet/hopr-protos/node/shutdown_pb'
import { ShutdownClient } from '@hoprnet/hopr-protos/node/shutdown_grpc_pb'

const SetupClient = <T extends typeof grpc.Client>(Client: T): InstanceType<T> => {
  return (new Client('localhost:50051', grpc.credentials.createInsecure()) as unknown) as InstanceType<T>
}

// @TODO: fix open handles
describe('GRPC transport', () => {
  const appPeerId = '16Uiu2HAm5mELjrpXgq7oBSgdHsFYK3d1M2argd2d2KS5WHfzmDuW'
  let app: INestApplication

  beforeAll(async () => {
    const AppTestModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              debug: true,
              id: 1, // if you this, you need to update 'appPeerId'
              bootstrapNode: true,
              host: '0.0.0.0:9091',
            }),
          ],
        }),
        AppModule,
      ],
    }).compile()

    app = AppTestModule.createNestApplication()
    app.connectMicroservice({
      transport: Transport.GRPC,
      options: {
        url: '0.0.0.0:50051',
        package: PROTO_PACKAGES,
        protoPath: PROTO_FILES,
        loader: {
          includeDirs: [HOPR_PROTOS_FOLDER_DIR],
        },
      },
    })

    await app.startAllMicroservicesAsync()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should get status', async (done) => {
    const client = SetupClient(StatusClient)

    client.getStatus(new StatusRequest(), (err, res) => {
      expect(err).toBeFalsy()

      const data = res.toObject()
      expect(data.id).toBe(appPeerId)
      expect(data.multiAddressesList.length).toBeGreaterThan(0)
      expect(data.connectedNodes).toBe(0)

      client.close()
      done()
    })
  })

  it('should get version', async (done) => {
    const client = SetupClient(VersionClient)

    client.getVersion(new VersionRequest(), (err, res) => {
      expect(err).toBeFalsy()

      const data = res.toObject()
      expect(typeof data.version).toBe('string')
      expect(data.componentsVersionMap).toHaveLength(5)

      client.close()
      done()
    })
  })

  it('should shutdown', async (done) => {
    const client = SetupClient(ShutdownClient)

    client.shutdown(new ShutdownRequest(), (err, res) => {
      expect(err).toBeFalsy()

      const data = res.toObject()
      expect(data.timestamp).toBeGreaterThan(0)

      client.close()
      done()
    })
  })
})
