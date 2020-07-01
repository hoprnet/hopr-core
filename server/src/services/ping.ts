import { Service } from '../utils'

export default Service(
  'ping.proto',
  (definition) => {
    return definition.ping.Ping.service
  },
  {
    ping: (call, callback) => {
      return callback(null, {
        latency: 1337,
      })
    },
  }
)
