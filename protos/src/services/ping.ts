import { Service } from '../utils'

export default Service(
  'ping.proto',
  (definition) => {
    return definition.ping.Ping
  },
  {
    ping: (call, callback) => {
      return callback(null, {
        latency: 1337,
      })
    },
  }
)
