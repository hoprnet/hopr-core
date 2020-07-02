import { Service } from '../utils'

export default Service(
  'version.proto',
  (definition) => {
    return definition.version.Version
  },
  {
    getVersion: (call, callback) => {
      return callback(null, {
        version: 'v1.0.0-1DWQD',
        components_version: {
          x: 'v1.2.0-1DWQD',
          y: 'v0.1.0-1DWQD',
        },
      })
    },
  }
)
