import { expect } from 'chai'
import { credentials } from '@grpc/grpc-js'
import * as services from '.'
import * as server from '../server'

describe('version', function () {
  // @ts-ignore
  const client = new services.version.definition.version.Version('localhost:50051', credentials.createInsecure())

  beforeEach(async function () {
    await server.start()
  })

  afterEach(async function () {
    await server.stop()
  })

  it.skip('should get latency', function (done) {
    client.getVersion({}, (err, response) => {
      if (err) throw err

      expect(response).to.be.deep.equal({
        version: 'v1.0.0-1DWQD',
        components_version: {
          x: 'v1.2.0-1DWQD',
          y: 'v0.1.0-1DWQD',
        },
      })
      done()
    })
  })
})
