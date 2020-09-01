import * as stun from 'webrtc-stun'

import net, { AddressInfo } from 'net'

import Multiaddr from 'multiaddr'

export type Interface = {
  family: 'IPv4' | 'IPv6'
  port: number
  address: string
}

export const STUN_TIMEOUT = 500

export function handleStunRequest(address: AddressInfo, data: Buffer): Buffer {
  const req = stun.createBlank()

  // if msg is valid STUN message
  if (req.loadBuffer(data)) {
    // if STUN message is BINDING_REQUEST and valid content
    if (req.isBindingRequest({ fingerprint: true })) {
      const res = req
        .createBindingResponse(true)
        // @ts-ignore
        .setXorMappedAddressAttribute(address)
        .setFingerprintAttribute()

      return res.toBuffer()
    }
  }
}

export function getPublicIp(myAddress: Multiaddr, stunServer: Multiaddr): Promise<AddressInfo> {
  return new Promise<AddressInfo>((resolve, reject) => {
    let finished = false
    setTimeout(() => {
      finished = true
      reject()
    }, STUN_TIMEOUT)

    const cOptsOwn = myAddress.nodeAddress()
    const cOptsStun = stunServer.nodeAddress()

    const socket = net.connect(
      {
        port: parseInt(cOptsStun.port, 10),
        host: cOptsStun.address,
        localPort: parseInt(cOptsOwn.port, 10),
        localAddress: cOptsOwn.address,
      },
      () => {
        const transactionId = stun.generateTransactionId()

        if (finished) {
          socket.destroy()
          socket.once('close', () => setTimeout(reject, 50))
          return
        }

        socket.on('data', (data: Buffer) => {
          const res = stun.createBlank()

          if (res.loadBuffer(data)) {
            // if msg is BINDING_RESPONSE_SUCCESS and valid content
            if (res.isBindingResponseSuccess({ transactionId })) {
              const attr = res.getXorMappedAddressAttribute()
              if (attr) {
                socket.destroy()

                if (!finished) {
                  socket.once('close', () => setTimeout(() => resolve(res.getXorMappedAddressAttribute()), 50))
                }
              }
            }
          }
        })

        const req = stun.createBindingRequest(transactionId).setFingerprintAttribute()

        socket.write(req.toBuffer())
      }
    )
  })
}
