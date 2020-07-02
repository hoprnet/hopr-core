import { expect } from 'chai'
import { credentials } from '@grpc/grpc-js'
import * as services from '.'
import * as server from '../server'

describe('ping', function () {
  // @ts-ignore
  const client = new services.ping.service('localhost:50051', credentials.createInsecure())

  beforeEach(async function () {
    await server.start()
  })

  afterEach(async function () {
    await server.stop()
  })

  it('should get latency', function (done) {
    client.ping({}, (err, response) => {
      if (err) throw err

      expect(response).to.be.deep.equal({ latency: 1337 })
      done()
    })
  })
})
