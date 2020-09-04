import assert from 'assert'
import Listener from './listener'
import Multiaddr from 'multiaddr'
import { Upgrader } from './types'
import dgram, { Socket, RemoteInfo } from 'dgram'
import { handleStunRequest } from './stun'

describe('check listening to sockets', function () {
  async function startStunServer(port: number, state: { msgReceived: boolean }): Promise<Socket> {
    const promises: Promise<void>[] = []
    const socket = dgram.createSocket('udp4')

    promises.push(new Promise((resolve) => socket.once('listening', resolve)))

    promises.push(new Promise((resolve) => socket.bind(port, resolve)))

    socket.on('message', (msg: Buffer, rinfo: RemoteInfo) => {
      state.msgReceived = true
      handleStunRequest(socket, msg, rinfo)
    })

    await Promise.all(promises)
    return socket
  }
  it('should successfully recreate the socket', async function () {
    let listener: Listener

    // Create objects to pass boolean by reference and NOT by value
    const msgReceived = [
      {
        msgReceived: false,
      },
      {
        msgReceived: false,
      },
    ]

    const stunServers = [await startStunServer(9091, msgReceived[0]), await startStunServer(9092, msgReceived[1])]

    for (let i = 0; i < 2; i++) {
      listener = new Listener(() => {}, (undefined as unknown) as Upgrader, [
        Multiaddr(`/ip4/127.0.0.1/udp/${stunServers[0].address().port}`),
        Multiaddr(`/ip4/127.0.0.1/udp/${stunServers[1].address().port}`),
      ])

      await listener.listen(Multiaddr('/ip4/127.0.0.1/tcp/9090'))
      await listener.close()
    }

    stunServers.forEach((server) => server.close())

    assert(
      msgReceived[0].msgReceived && msgReceived[1].msgReceived,
      `Stun Server must have received messages from both Listener instances.`
    )
  })
})
