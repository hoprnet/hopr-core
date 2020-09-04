import net, { AddressInfo, Socket as TCPSocket } from 'net'
import dgram, { RemoteInfo } from 'dgram'

import EventEmitter from 'events'
import debug from 'debug'

const log = debug('hopr-core:transport:listener')
const error = debug('hopr-core:transport:listener:error')

import { socketToConn } from './socket-to-conn'
import { CODE_P2P } from './constants'
import { getMultiaddrs, multiaddrToNetConfig } from './utils'
import { MultiaddrConnection, Connection, Upgrader, Libp2pServer } from './types'
import Multiaddr from 'multiaddr'

import { handleStunRequest, getExternalIp } from './stun'

/**
 * Attempts to close the given maConn. If a failure occurs, it will be logged.
 * @private
 * @param maConn
 */
async function attemptClose(maConn: MultiaddrConnection) {
  try {
    maConn && (await maConn.close())
  } catch (err) {
    error('an error occurred closing the connection', err)
  }
}

enum State {
  UNINITIALIZED,
  LISTENING,
  CLOSED,
}

class Listener extends EventEmitter {
  private __connections: MultiaddrConnection[]
  private tcpSocket: net.Server
  private udpSocket: dgram.Socket

  private state: State

  private listeningAddr: Multiaddr
  private peerId: string

  private externalAddress: {
    address: string
    port: number
  }

  constructor(
    private handler: (conn: Connection) => void,
    private upgrader: Upgrader,
    private stunServers: Multiaddr[]
  ) {
    super()

    this.__connections = []

    this.tcpSocket = net.createServer(this.onTCPConnection) as Libp2pServer

    this.udpSocket = dgram.createSocket({
      type: 'udp6',
      reuseAddr: true,
    })

    this.state = State.UNINITIALIZED

    Promise.all([
      new Promise((resolve) => this.udpSocket.once('listening', resolve)),
      new Promise((resolve) => this.tcpSocket.once('listening', resolve)),
    ]).then(() => {
      this.state = State.LISTENING
      this.emit('listening')
    })

    Promise.all([
      new Promise((resolve) => this.udpSocket.once('close', resolve)),
      new Promise((resolve) => this.tcpSocket.once('close', resolve)),
    ]).then(() => this.emit('close'))

    this.udpSocket.on('message', (msg: Buffer, rinfo: RemoteInfo) => handleStunRequest(this.udpSocket, msg, rinfo))

    this.tcpSocket.on('error', (err) => this.emit('error', err))
    this.udpSocket.on('error', (err) => this.emit('error', err))
  }

  async listen(ma: Multiaddr): Promise<void> {
    if (this.state == State.CLOSED) {
      throw Error(`Cannot listen after 'close()' has been called`)
    }

    this.listeningAddr = ma
    this.peerId = ma.getPeerId()

    if (this.peerId == null) {
      this.listeningAddr = ma.decapsulateCode(CODE_P2P)

      if (!this.listeningAddr.isThinWaistAddress()) {
        throw Error(`Unable to bind socket to <${this.listeningAddr.toString()}>`)
      }
    }

    const options = multiaddrToNetConfig(this.listeningAddr)

    await Promise.all([
      new Promise((resolve, reject) =>
        this.tcpSocket.listen(options, (err?: Error) => {
          if (err) return reject(err)
          log('Listening on %s', this.tcpSocket.address())
          resolve()
        })
      ),
      new Promise((resolve) =>
        this.udpSocket.bind(parseInt(ma.nodeAddress().port, 10), async () => {
          try {
            this.externalAddress = await getExternalIp(this.stunServers, this.udpSocket)
          } catch (err) {
            console.log(err)
            error(`Unable to fetch external address using STUN. Error was: ${err}`)
          }

          resolve()
        })
      ),
    ]).then(() => (this.state = State.LISTENING))
  }

  async close(): Promise<void> {
    return new Promise(async (resolve, rejcect) => {
      await Promise.all([
        new Promise((resolve) => {
          this.udpSocket.once('close', resolve)
          this.udpSocket.close()
        }),
        this.tcpSocket.listening
          ? new Promise((resolve, reject) => {
              this.__connections.forEach((maConn: MultiaddrConnection) => attemptClose(maConn))
              this.tcpSocket.close((err) => (err ? reject(err) : resolve()))
            })
          : Promise.resolve(),
      ])

      this.state = State.CLOSED

      // Give the operating system some time to release the sockets
      setTimeout(resolve, 100)
    })
  }

  getAddrs() {
    if (this.state != State.LISTENING) {
      throw Error(`Listener is not yet ready`)
    }

    let addrs: Multiaddr[] = []
    const address = this.tcpSocket.address() as AddressInfo

    // Because TCP will only return the IPv6 version
    // we need to capture from the passed multiaddr
    if (this.listeningAddr?.toString().startsWith('/ip4')) {
      if (this.externalAddress != null) {
        if (this.externalAddress.port == null) {
          console.log(`Attention: Bidirectional NAT detected. Publishing no public ip address to the DHT`)
          if (this.peerId != null) {
            addrs.push(Multiaddr(''))
          }
        } else {
          addrs.push(Multiaddr(`/ip4/${this.externalAddress.address}/tcp/${this.externalAddress.port}`))
        }
      }

      addrs.push(...getMultiaddrs('ip4', address.address, address.port))
    } else if (address.family === 'IPv6') {
      addrs = addrs.concat(getMultiaddrs('ip6', address.address, address.port))
    }

    return addrs.map((ma) => (this.peerId ? ma.encapsulate(`/p2p/${this.peerId}`) : ma))
  }

  private trackConn(maConn: MultiaddrConnection) {
    this.__connections.push(maConn)

    const untrackConn = () => {
      this.__connections = this.__connections.filter((c) => c !== maConn)
    }

    maConn.conn.once('close', untrackConn)
  }

  private async onTCPConnection(socket: TCPSocket) {
    // Avoid uncaught errors caused by unstable connections
    socket.on('error', (err) => error('socket error', err))

    let maConn: MultiaddrConnection
    let conn: Connection
    try {
      maConn = socketToConn(socket, { listeningAddr: this.listeningAddr })
      log('new inbound connection %s', maConn.remoteAddr)
      conn = await this.upgrader.upgradeInbound(maConn)
    } catch (err) {
      error('inbound connection failed', err)
      return attemptClose(maConn)
    }

    log('inbound connection %s upgraded', maConn.remoteAddr)

    this.trackConn(maConn)

    this.handler?.(conn)

    this.emit('connection', conn)
  }
}

export default Listener
