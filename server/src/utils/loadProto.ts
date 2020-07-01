import path from 'path'
import { loadPackageDefinition, ServiceDefinition } from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import { PROTOS_PATH } from '../constants'

export default function loadProto(fileName: string) {
  const filePath = path.join(PROTOS_PATH, fileName)
  return loadPackageDefinition(protoLoader.loadSync(filePath))
}
