import { join } from 'path'

export const HOPR_PROTOS_DIR = join(__dirname, '..', 'node_modules', '@hoprnet/hopr-protos', 'protos')
// @TODO: use a pre-build tool to expose this data from within @hoprnet/hopr-protos
export const PROTO_PACKAGES = ['status', 'version', 'shutdown']
export const PROTO_FILES = PROTO_PACKAGES.map(pkg => `${pkg}.proto`)

