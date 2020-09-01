import net, { Server, AddressInfo, Socket } from 'net'
import { handleStunRequest, getPublicIp } from './stun'
import Multiaddr from 'multiaddr'
import assert from 'assert'

describe('test STUN', function () {
  it('should perform a STUN request', async function () {
    const server = await new Promise<Server>((resolve) => {
      const server = net.createServer((socket: Socket) => {
        socket.on('data', (data) => {
          socket.write(
            handleStunRequest(
              { address: socket.remoteAddress, family: socket.remoteFamily, port: socket.remotePort } as AddressInfo,
              data
            )
          )
        })
      })

      server.on('listening', () => resolve(server))

      server.listen()
    })

    const result = await getPublicIp(
      Multiaddr('/ip4/127.0.0.1/tcp/9000'),
      Multiaddr(`/ip4/127.0.0.1/tcp/${(server.address() as AddressInfo).port}`)
    )

    const result2 = await getPublicIp(
      Multiaddr('/ip4/127.0.0.1/tcp/9000'),
      Multiaddr(`/ip4/127.0.0.1/tcp/${(server.address() as AddressInfo).port}`)
    )

    await new Promise((resolve) => server.close(resolve))

    assert(result.port == 9000 && result2.port == 9001)
  })
})
