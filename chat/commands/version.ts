import type AbstractCommand from './abstractCommand'
import pkg from '../../package.json'

export default class Version implements AbstractCommand {
  constructor() {}

  async execute(query?: string) {
    console.log(pkg.version)
  }

  complete() {}
}
