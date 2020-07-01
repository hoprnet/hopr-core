import { Server, ServerCredentials } from '@grpc/grpc-js'
import * as services from './services'

let server: Server

export function start() {
  return new Promise((resolve, reject) => {
    server = new Server()

    for (const service of Object.values(services)) {
      // serviception
      // @ts-ignore
      server.addService(service.service.service, service.implementation)
    }

    server.bindAsync('localhost:50051', ServerCredentials.createInsecure(), (err, port) => {
      if (err) return reject(err)

      server.start()
      resolve()
    })
  })
}

export async function stop() {
  if (typeof server === 'undefined') return

  server.forceShutdown()
}
