import HoprCore from '.'
import type HoprCoreConnector from '@hoprnet/hopr-core-connector-interface'

import { createMock } from 'ts-auto-mock'

describe('test hopr-core', function () {
  it('should start a node', function (done) {
    const MockConnector: typeof HoprCoreConnector = createMock<typeof HoprCoreConnector>()

    expect(
      HoprCore.create({
        debug: true,
        bootstrapNode: true,
        network: 'mocks',
        connector: MockConnector,
        provider: 'ws://127.0.0.1:9545',
        hosts: {
          ip4: {
            ip: '0.0.0.0',
            port: 9091,
          },
        },
      })
    )
      .resolves.not.toBeUndefined()
      .then(done)
  })
})
