import { Ganache } from '@hoprnet/hopr-testing'
import { migrate } from '@hoprnet/hopr-ethereum'
import { durations } from '@hoprnet/hopr-utils'
import HoprCore from '.'

const GANACHE_PORT = 9545 // We have to use this as it's hardcoded in hopr-ethereum / truffle-networks
const HOPR_PORT = 60091

describe('test hopr-core', function () {
  const ganache = new Ganache({ port: GANACHE_PORT })
  let node

  beforeAll(async function () {
    jest.setTimeout(durations.seconds(30))
    await ganache.start()
    await migrate()
  })

  afterAll(async function () {
    await node.stop()
  })

  it('should start a node', async function () {
    node = await HoprCore.create({
      debug: true,
      bootstrapNode: true,
      network: 'ethereum',
      provider: `ws://127.0.0.1:${GANACHE_PORT}`,
      hosts: {
        ip4: {
          ip: '0.0.0.0',
          port: HOPR_PORT,
        },
      },
    })
    expect(node).toBeDefined()
  })

  it('should expose statistics', function (done) {
    expect(node.getStats()).toBeDefined()
  })
})
