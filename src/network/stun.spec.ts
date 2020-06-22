import Stun from './stun'
import assert from 'assert'
import { HoprOptions } from '..'

describe('test the STUN functionalities', function () {
  async function generateNode(options: HoprOptions) {
    const node = new Stun(options)

    if (options.bootstrapNode) {
      await node.startServer()
    }

    return node
  }

  it('should launch a STUN server and connect to it', async function () {
    const bootstrap = await generateNode({
      bootstrapNode: true,
      hosts: {
        ip4: {},
      },
    } as HoprOptions)

    const external = await Stun.getExternalIP({
      hostname: '127.0.0.1',
      port: 3478,
    })

    assert(external.address === '127.0.0.1')

    const external2 = await Stun.getExternalIP(
      {
        hostname: 'stun.l.google.com',
        port: 19302,
      },
      3479
    )

    const external3 = await Stun.getExternalIP(
      {
        hostname: 'stun.l.google.com',
        port: 19302,
      },
      3479
    )

    assert.deepEqual(external2, external3)

    assert(external2.address !== '127.0.0.1')

    await bootstrap.stopServer()
  })
})
