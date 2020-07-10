import { Test } from '@nestjs/testing'
import { ConfigModule } from "@nestjs/config"
import { INestApplication } from '@nestjs/common'
import { Transport } from '@nestjs/microservices'
import * as grpc from 'grpc'
import { StatusRequest } from '@hoprnet/hopr-protos/node/status_pb'
import { StatusClient } from '@hoprnet/hopr-protos/node/status_grpc_pb'
import { AppModule } from '../src/app.module'
import { HOPR_PROTOS_DIR, PROTO_PACKAGES, PROTO_FILES } from "../src/constants"


// @TODO: fix open handles
describe('GRPC transport', () => {
  const appPeerId = "16Uiu2HAm5mELjrpXgq7oBSgdHsFYK3d1M2argd2d2KS5WHfzmDuW"
  let app: INestApplication

  beforeEach(async () => {
    const AppTestModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              debug: true,
              id: 1, // if you this, you need to update 'appPeerId'
              bootstrapNode: true,
              host: "0.0.0.0:9091"
            })
          ]
        }),
        AppModule
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
          includeDirs: [HOPR_PROTOS_DIR],
        },
      },
    })

    await app.startAllMicroservicesAsync()
    await app.init()
  })

  afterEach(async () => {
    await app.close()
  })

  it('getStatus', async (done) => {
    const client = new StatusClient('localhost:50051', grpc.credentials.createInsecure())

    client.getStatus(new StatusRequest(), (err, res) => {
      expect(err).toBeFalsy()

      const data = res.toObject()
      expect(data.id).toBe(appPeerId)
      expect(data.connectedNodes).toBe(0)

      client.close()
      done()
    })
  })
})
