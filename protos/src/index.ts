import * as server from './server'

server
  .start()
  .then(() => {
    console.log('GRPC server started')
  })
  .catch(console.error)
