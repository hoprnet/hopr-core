import dgram, { RemoteInfo } from 'dgram'
import type { Socket } from 'dgram'
import { getExternalIp, handleStunRequest } from './stun'
import Multiaddr from 'multiaddr'
import assert from 'assert'

describe('test STUN', function () {
  it('should perform a STUN request', async function () {
    const bindPromises: Promise<void>[] = []
    const servers = Array.from({ length: 4 }).map((_) => {
      const server = dgram.createSocket('udp6')

      bindPromises.push(
        new Promise<void>((resolve) => server.once('listening', resolve))
      )
      server.bind()

      server.on('message', (msg: Buffer, rinfo: RemoteInfo) => handleStunRequest(server, msg, rinfo))

      return server
    })

    const client = dgram.createSocket('udp6')

    bindPromises.push(
      new Promise<void>((resolve) => client.once('listening', resolve))
    )

    client.bind()

    await Promise.all(bindPromises)

    const multiAddrs = servers.map((server: Socket) => Multiaddr.fromNodeAddress(server.address() as any, 'udp'))

    const result = await getExternalIp(multiAddrs, client)

    assert(
      client.address().port == result.port &&
        (client.address().address === result.address || client.address().address.concat('1') === result.address)
    )

    servers.forEach((server) => server.close())
    client.close()

    await new Promise((resolve) => setTimeout(() => resolve(), 140))
  })
  // it('should perform a STUN request', async function () {
  //   const server = await new Promise<Server>((resolve) => {
  //     const server = net.createServer((socket: Socket) => {
  //       socket.on('data', (data) => {
  //         socket.write(
  //           handleStunRequest(
  //             { address: socket.remoteAddress, family: socket.remoteFamily, port: socket.remotePort } as AddressInfo,
  //             data
  //           )
  //         )
  //       })
  //     })

  //     server.on('listening', () => resolve(server))

  //     server.listen()
  //   })

  //   const result = await getPublicIp(
  //     Multiaddr('/ip4/127.0.0.1/tcp/9000'),
  //     Multiaddr(`/ip4/127.0.0.1/tcp/${(server.address() as AddressInfo).port}`)
  //   )

  //   const result2 = await getPublicIp(
  //     Multiaddr('/ip4/127.0.0.1/tcp/9000'),
  //     Multiaddr(`/ip4/127.0.0.1/tcp/${(server.address() as AddressInfo).port}`)
  //   )

  //   await new Promise((resolve) => server.close(resolve))

  //   assert(result.port == 9000 && result2.port == 9000, `multiple STUN requests must return the same port`)
  // })

  // it('should timeout intentionally on a STUN request', async function () {
  //   const server = await new Promise<Server>((resolve) => {
  //     const server = net.createServer((socket: Socket) => {
  //       socket.on('data', (data) => {
  //         setTimeout(
  //           () =>
  //             socket.write(
  //               handleStunRequest(
  //                 {
  //                   address: socket.remoteAddress,
  //                   family: socket.remoteFamily,
  //                   port: socket.remotePort,
  //                 } as AddressInfo,
  //                 data
  //               )
  //             ),
  //           STUN_TIMEOUT + 50
  //         )
  //       })
  //     })

  //     server.on('listening', () => resolve(server))

  //     server.listen()
  //   })

  //   let errTrown = false
  //   try {
  //     await getPublicIp(
  //       Multiaddr('/ip4/127.0.0.1/tcp/9000'),
  //       Multiaddr(`/ip4/127.0.0.1/tcp/${(server.address() as AddressInfo).port}`)
  //     )
  //   } catch (err) {
  //     errTrown = true
  //   }

  //   await new Promise((resolve) => server.close(resolve))

  //   assert(errTrown, `STUN request must fail`)
  // })
})
