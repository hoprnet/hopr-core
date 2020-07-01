import type { ServiceDefinition } from '@grpc/grpc-js'
import loadProto from './loadProto'

type ServiceImplementation = {
  [key: string]: (call: any, callback: any) => void
}

export default function Service(
  fileName: string,
  getService: (definition: any) => ServiceDefinition,
  implementation: ServiceImplementation
) {
  const definition = loadProto(fileName)
  const service = getService(definition)

  return {
    fileName,
    definition,
    service,
    implementation,
  }
}
