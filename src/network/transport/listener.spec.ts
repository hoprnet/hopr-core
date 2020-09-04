import assert from 'assert'
import Listener from './listener'
import Multiaddr from 'multiaddr'
import { Upgrader } from './types'

describe('check listening to sockets', function () {
  it('should successfully recreate the socket', async function () {
    let listener: Listener

    for (let i = 0; i < 2; i++) {
      listener = new Listener(() => {}, (undefined as unknown) as Upgrader, [Multiaddr('/ip4/127.0.0.1/udp/123')])

      await listener.listen(Multiaddr('/ip4/127.0.0.1/tcp/9090'))
      await listener.close()
    }
  })
})
