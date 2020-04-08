import dotenv from 'dotenv'
// @ts-ignore
const dotenvExpand = require('dotenv-expand')

const env = dotenv.config()
dotenvExpand(env)

import chalk from 'chalk'

import readline from 'readline'

import PeerInfo from 'peer-info'

import type HoprCoreConnector from '@hoprnet/hopr-core-connector-interface'

import Hopr from '../src'
import type { HoprOptions } from '../src'

import figlet from 'figlet'
import clear from 'clear'

import { parseOptions } from './utils'
import Commands from './commands'

const SPLIT_OPERAND_QUERY_REGEX: RegExp = /([\w\-]+)(?:\s+)?([\w\s\-.]+)?/

// Allowed keywords
export const keywords: string[][] = [
    ['open', 'opens a payment channel'],
    ['send', 'sends a message to another party'],
    ['quit', 'stops the node and terminates the process'],
    ['crawl', 'crawls the network and tries to find other nodes'],
    ['openChannels', 'lists all currently open channels'],
    ['closeAll', 'closes all payment channel of this node'],
    ['myAddress', 'shows the address of this node'],
    ['balance', 'shows our current balance'],
    ['listConnectors', 'lists all installed blockchain connectors'],
    ['ping', 'pings another node to check its availability'],
    ['help', 'shows this help page']
].sort((a, b) => a[0].localeCompare(b[0], 'en', {sensitivity: 'base'}))

// Allowed CLI options
export const cli_options: string[][] = [
    ['-b', '--bootstrapNode, bootstrap', 'starts HOPR as a bootstrap node'],
    ['-n <connector>', '--network', 'starts HOPR with blockchain connector <connector>'],
    ['-h', '--help', 'shows this help page'],
    ['-l', '--listConnectors', 'shows all available connectors'],
    ['<ID>', undefined, 'starts HOPR with a demo ID']
].sort((a, b) => a[0].localeCompare(b[0], 'en', {sensitivity: 'base'}))

// Name our process 'hopr'
process.title = 'hopr'



/**
 * Alphabetical list of known connectors.
 */
export const knownConnectors = [
    /* prettier-ignore */
    ['@hoprnet/hopr-core-ethereum', 'ethereum'],
    ['@hoprnet/hopr-core-polkadot', 'polkadot']
]

let node: Hopr<HoprCoreConnector>

/**
 * Completes a given input with possible endings. Used for convenience.
 *
 * @param line the current input
 * @param cb to returns the suggestions
 */
function tabCompletion(commands: Commands) {
    return async (line: string, cb: (err: Error | undefined, hits: [string[], string]) => void) => {
        if (line == null || line == '') {
            return cb(undefined, [keywords.map(entry => entry[0]), line])
        }

        const [command, query]: (string | undefined)[] = line
            .trim()
            .split(SPLIT_OPERAND_QUERY_REGEX)
            .slice(1)

        if (command == null || command === '') {
            return cb(undefined, [keywords.map(entry => entry[0]), line])
        }

        switch (command.trim()) {
            case 'send':
                await commands.sendMessage.complete(line, cb, query)
                break
            case 'open':
                await commands.openChannel.complete(line, cb, query)
                break
            case 'close':
                await commands.closeChannel.complete(line, cb, query)
                break
            case 'ping': {
                await commands.ping.complete(line, cb, query)
            }
            default:
                const hits = keywords.reduce((acc: string[], keyword: [string, string]) => {
                    if (keyword[0].startsWith(line)) {
                        acc.push(keyword[0])
                    }

                    return acc
                }, [])

                return cb(undefined, [hits.length ? hits : keywords.map(keyword => keyword[0]), line])
        }
    }
}

async function runAsRegularNode() {
    const commands = new Commands(node)

    let rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        completer: tabCompletion(commands)
    })

    rl.once('close', async () => {
        await commands.stopNode.execute()
        return
    })

    console.log(`Connecting to bootstrap node${node.bootstrapServers.length == 1 ? '' : 's'}...`)

    rl.on('line', async (input: string) => {
        if (input == null || input == '') {
            console.log(chalk.red('Unknown command!'))
            rl.prompt()
            return
        }

        const [command, query]: (string | undefined)[] = input
            .trim()
            .split(SPLIT_OPERAND_QUERY_REGEX)
            .slice(1)

        if (command == null) {
            console.log(chalk.red('Unknown command!'))
            rl.prompt()
            return
        }

        switch (command.trim()) {
            case 'balance':
                await commands.printBalance.execute()
                break
            case 'close':
                await commands.closeChannel.execute(query)
                break
            case 'crawl':
                await commands.crawl.execute()
                break
            case 'help':
                commands.listCommands.execute()
                break
            case 'quit':
                await commands.stopNode.execute()
                break
            case 'openChannels':
                await commands.listOpenChannels.execute()
                break
            case 'open':
                await commands.openChannel.execute(query)
                break
            case 'send':
                await commands.sendMessage.execute(rl, query)
                break

            case 'listConnectors':
                await commands.listConnectors.execute()
                break
            case 'myAddress':
                await commands.printAddress.execute()
                break
            case 'ping':
                await commands.ping.execute(query)
                break
            default:
                console.log(chalk.red('Unknown command!'))
                break
        }

        rl.prompt()
    })

    rl.prompt()
}



function runAsBootstrapNode() {
    console.log(`... running as bootstrap node!.`)

    node.on('peer:connect', (peer: PeerInfo) => {
        console.log(`Incoming connection from ${chalk.blue(peer.id.toB58String())}.`)
    })
}

async function main() {
    clear()
    console.log(
        figlet.textSync('HOPR.network', {
            horizontalLayout: 'fitted'
        })
    )
    console.log(`Welcome to ${chalk.bold('HOPR')}!\n`)

    let options: HoprOptions 
    try {
        options = await parseOptions()
    } catch (err) {
        console.log(err.message + '\n')
        return
    }

    try {
        node = await Hopr.createNode(options)
    } catch (err) {
        console.log(chalk.red(err.message))
        process.exit(1)
    }

    console.log(`\nAvailable under the following addresses:\n ${node.peerInfo.multiaddrs.toArray().join('\n ')}\n`)

    if (options.bootstrapNode) {
        runAsBootstrapNode()
    } else {
        runAsRegularNode()
    }
}

main()