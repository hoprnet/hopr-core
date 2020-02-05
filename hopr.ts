import dotenv from 'dotenv'
dotenv.config()
import readline from 'readline'
import getopts from 'getopts'

import chalk from 'chalk'
const rlp = require('rlp')

import groupBy from 'lodash.groupby'

import BN from 'bn.js'

import PeerInfo from 'peer-info'
import PeerId from 'peer-id'
import Multiaddr from 'multiaddr'

const Multihash = require('multihashes')
const bs58 = require('bs58')

// @TODO
function toWei(amount: string, unit?: string) {
  return amount
}

// @TODO
function fromWei(amount: string | BN, unit?: string) {
  if (BN.isBN(amount)) {
    return amount.toString()
  }
  return amount
}

import Hopr from './src'
import { pubKeyToPeerId, addPubKey, u8aToHex } from './src/utils'

import HoprPolkadot from '@hoprnet/hopr-core-polkadot'
import HoprCoreConnector, { Types, ChannelInstance, HoprCoreConnectorInstance } from '@hoprnet/hopr-core-connector-interface'
// const { STAKE_GAS_AMOUNT } = require('./src/constants')

const MINIMAL_STAKE = new BN(toWei('0.10', 'ether'))
// const DEFAULT_STAKE = new BN(toWei('0.11', 'ether'))

const SPLIT_OPERAND_QUERY_REGEX: RegExp = /([\w\-]+)(?:\s+)?([\w\s\-.]+)?/

let node: Hopr<HoprPolkadot>,
  funds: Types.Balance,
  ownAddress: Types.AccountId,
  stakedFunds: Types.Balance,
  rl: readline.Interface,
  options,
  connector: HoprCoreConnector

/**
 * Parses the given command-line options and returns a configuration object.
 *
 * @returns {Object}
 */
function parseOptions() {
  const displayHelp = () => {
    console.log(
      /* prettier-ignore */
      `\nStart HOPR with:\n` +
            `-b [--bootstrapNode, bootstrap]\tstarts HOPR as a bootstrap node\n` +
            `<ID>\t\t\t\t\tstarts HOPR with ID <ID> specified .env\n`
    )
    process.exit(0)
  }

  const unknownOptions: string[] = []

  const options = getopts(process.argv.slice(2), {
    boolean: ['bootstrapNode'],
    string: ['network'],
    alias: {
      b: 'bootstrapNode',
      n: 'network'
    },
    unknown: (option: string) => {
      unknownOptions.push(option)
      return false
    }
  })

  delete options.b
  delete options.n

  if (options._ != null) {
    options._.forEach((option: string) => {
      try {
        const int = parseInt(option)

        if (isFinite(int)) {
          options.id = int
        }
      } catch {}
    })
  }

  delete options._

  if (unknownOptions.length) {
    console.log(`Got unknown option${unknownOptions.length == 1 ? '' : 's'} [${unknownOptions.join(', ')}]`)
    return displayHelp()
  }

  if (options.network == null || options.network == 'ethereum') {
    throw Error(`not implemented`)
  } else if (options.network == `polkadot`) {
    connector = HoprPolkadot
  }

  const tmp = groupBy(
    process.env.BOOTSTRAP_SERVERS.split(',').map(addr => Multiaddr(addr)),
    (ma: Multiaddr) => ma.getPeerId()
  )
  options.bootstrapServers = Object.keys(tmp).reduce((acc, peerId: string) => {
    const peerInfo = new PeerInfo(PeerId.createFromB58String(peerId))

    tmp[peerId].forEach((ma: Multiaddr) => peerInfo.multiaddrs.add(ma))
    acc.push(peerInfo)
    return acc
  }, [])

  return options
}

/**
 * Checks whether the given PeerId belongs to any known bootstrap node.
 *
 * @param peerId
 */
function isNotBootstrapNode(peerId: PeerId): boolean {
  return !node.bootstrapServers.some((peerInfo: PeerInfo) => peerInfo.id.isEqual(peerId))
}

// Allowed keywords
const keywords = ['open', 'stake', 'stakedEther', 'unstake', 'send', 'quit', 'crawl', 'openChannels', 'closeAll', 'myAddress']

/**
 * Completes a given input with possible endings. Used for convenience.
 *
 * @param line the current input
 * @param cb called with `(err, [possibleCompletions, currentLine])`
 */
function tabCompletion(line: string, cb: (err: Error, hits: [string[], string]) => void) {
  const [command, query]: (string | undefined)[] = (line == null ? '' : line)
    .trim()
    .split(SPLIT_OPERAND_QUERY_REGEX)
    .slice(1)

  let hits: any
  switch (command) {
    case 'send':
      hits = node.peerBook.getAllArray().filter((peerInfo: PeerInfo) => {
        if (query && !peerInfo.id.toB58String().startsWith(query)) return false

        return isNotBootstrapNode(peerInfo.id)
      })

      if (!hits.length) {
        console.log(chalk.red(`\nDoesn't know any other node except the bootstrap node${node.bootstrapServers.length == 1 ? '' : 's'}!`))
        return cb(null, [[''], line])
      }

      return cb(null, [hits.map((peerInfo: PeerInfo) => `send ${peerInfo.id.toB58String()}`), line])
    case 'stake':
      if (funds.isZero()) {
        console.log(chalk.red(`\nCan't stake any funds without any ${node.paymentChannels.types.Balance.SYMBOL}.`))
        return [['stake 0.00'], line]
      }

      return cb(null, [[`stake ${fromWei(funds)}`], line])

    case 'unstake':
      return cb(null, [[`unstake ${fromWei(stakedFunds, 'ether')}`], line])
    case 'open':
      node.paymentChannels.channel.getAll(
        node.paymentChannels,
        async (channel: ChannelInstance) => u8aToHex(await channel.channelId),
        (channelIds: Promise<string>[]) =>
          Promise.all(channelIds)
            .then((channelIds: string[]) => {
              const channelIdSet = new Set<string>(channelIds)
              const peers = node.peerBook.getAllArray().reduce(async (acc: string[], peerInfo: PeerInfo) => {
                if (!isNotBootstrapNode(peerInfo.id)) {
                  return acc
                }

                const channelId = (
                  await node.paymentChannels.utils.getId(
                    await node.paymentChannels.utils.pubKeyToAccountId(node.peerInfo.id.pubKey.marshal()),
                    await node.paymentChannels.utils.pubKeyToAccountId(peerInfo.id.pubKey.marshal()),
                    node.paymentChannels.api
                  )
                ).toString()

                if (!channelIdSet.has(channelId)) {
                  acc.push(peerInfo.id.toB58String())
                }

                return acc
              }, [])

              channelIdSet.clear()

              if (peers.length < 1) {
                console.log(chalk.red(`\nDoesn't know any node to open a payment channel with.`))
                return cb(null, [[''], line])
              }

              hits = query ? peers.filter((peerId: string) => peerId.startsWith(query)) : peers

              return cb(null, [hits.length ? hits.map((str: string) => `open ${str}`) : ['open'], line])
            })
            .catch(err => {
              console.log(chalk.red(err.message))
              return cb(null, [[''], line])
            })
      )
      break
    case 'close':
      node.paymentChannels.channel.getAll(
        node.paymentChannels,
        (channel: ChannelInstance) => pubKeyToPeerId(channel.counterparty),
        (peerIds: Promise<PeerId | undefined>[]) =>
          Promise.all(peerIds)
            .then((peerIds: (PeerId | undefined)[]) => {
              peerIds = peerIds.filter((peerId: PeerId | undefined) => peerId != null)

              if (peerIds != null && peerIds.length < 1) {
                console.log(chalk.red(`\nCannot close any channel because there are not any open ones and/or channels were opened by a third party.`))
                return cb(null, [[''], line])
              }

              hits = query
                ? peerIds.reduce((result: string[], peerId: PeerId) => {
                    if (peerId.toB58String().startsWith(query)) {
                      result.push(peerId.toB58String())
                    }

                    return result
                  }, [])
                : peerIds.map((peerId: PeerId) => peerId.toB58String())

              return cb(null, [hits.length ? hits.map((str: string) => `close ${str}`) : ['close'], line])
            })
            .catch(err => {
              console.log(chalk.red(err.message))
              return cb(null, [[''], line])
            })
      )
      break
    default:
      hits = keywords.filter(keyword => keyword.startsWith(line))

      return cb(null, [hits.length ? hits : keywords, line])
  }
}

/**
 * Takes the string representation of a peerId and checks whether it is a valid
 * peerId, i. e. it is a valid base58 encoding.
 * It then generates a PeerId instance and returns it.
 *
 * @param query query that contains the peerId
 */
async function checkPeerIdInput(query: string): Promise<PeerId> {
  let peerId: PeerId

  try {
    // Throws an error if the Id is invalid
    Multihash.decode(bs58.decode(query))

    peerId = await addPubKey(PeerId.createFromB58String(query))
  } catch (err) {
    throw Error(chalk.red(`Invalid peerId. ${err.message}`))
  }
  return peerId
}

/**
 * Stops the node and kills the process in case it does not quit by itself.
 */
async function stopNode(): Promise<void> {
  const timeout = setTimeout(() => {
    console.log(`Ungracefully stopping node after timeout.`)
    process.exit(0)
  }, 10 * 1000)

  return (
    node
      .stop()
      /* prettier-ignore */
      .then(() => clearTimeout(timeout))
      .catch(() => process.exit(0))
  )
}

function runAsBootstrapNode() {
  if (options.bootstrapNode) {
    console.log(`... running as bootstrap node!.`)
  }

  node.on('peer:connect', (peer: PeerInfo) => {
    console.log(`Incoming connection from ${chalk.blue(peer.id.toB58String())}.`)
  })
}

async function runAsRegularNode() {
  ownAddress = await node.paymentChannels.utils.pubKeyToAccountId(node.peerInfo.id.pubKey.marshal())

  try {
    ;[funds, stakedFunds] = await Promise.all([
      node.paymentChannels.accountBalance,
      Promise.resolve(new node.paymentChannels.types.Balance(node.paymentChannels.api.registry, 0))
      // node.paymentChannels.contract.methods
      //   .states(ownAddress)
      //   .call({ from: ownAddress })
      //   .then(result => new BN(result.stakedEther))
    ])
  } catch (err) {
    console.log(chalk.red(err.message))
    return stopNode()
  }

  console.log(
    `Own ${node.paymentChannels.CHAIN_NAME} address: ${chalk.green(await node.paymentChannels.utils.pubKeyToAccountId(node.peerInfo.id.pubKey.marshal()))}\n` +
      `Funds: ${fromWei(funds, 'ether')} ${node.paymentChannels.types.Balance.SYMBOL}\n` +
      `Stake: ${fromWei(stakedFunds, 'ether')} ${node.paymentChannels.types.Balance.SYMBOL}\n`
  )

  if (stakedFunds.lt(MINIMAL_STAKE)) {
    await new Promise<void>(resolve =>
      rl.question(
        `Staked ${node.paymentChannels.types.Balance.SYMBOL} is less than ${fromWei(MINIMAL_STAKE, 'ether')} ${
          node.paymentChannels.types.Balance.SYMBOL
        }. Do you want to increase the stake now? (${chalk.green('Y')}/${chalk.red('n')}): `,
        (answer: string) => {
          switch (answer.toLowerCase()) {
            case '':
            case 'y':
              rl.question(`Amount? : `, (answer: string) => resolve(stake(answer)))
              rl.write(fromWei(MINIMAL_STAKE.sub(stakedFunds), 'ether'))
              break
            case 'n':
              console.log(`Running HOPR with ${chalk.magenta(`${fromWei(stakedFunds, 'ether').toString()} ${node.paymentChannels.types.Balance.SYMBOL}`)}.`)
              return resolve()
            default:
              return stopNode()
          }
        }
      )
    )
  }

  console.log(`Connecting to bootstrap node${node.bootstrapServers.length == 1 ? '' : 's'}...`)

  rl.on('line', async (input: string) => {
    rl.pause()
    const [command, query]: (string | undefined)[] = (input || '')
      .trim()
      .split(SPLIT_OPERAND_QUERY_REGEX)
      .slice(1)

    switch ((command || '').trim()) {
      case 'crawl':
        crawl()
        break
      case 'quit':
        stopNode()
        break
      case 'stake':
        stake(query)
        break
      case 'stakedEther':
        let tmp = await getStakedEther()

        if (tmp) stakedFunds = tmp
        break
      case 'unstake':
        unstake(query)
        break
      case 'openChannels':
        openChannels()
        break
      case 'open':
        open(query)
        break
      case 'send':
        send(query)
        break
      case 'closeAll':
        closeAll()
        break
      case 'close':
        close(query)
        break
      case 'myAddress':
        console.log(`${node.paymentChannels.CHAIN_NAME}:\t${chalk.green(node.paymentChannels.utils.pubKeyToAccountId(node.peerInfo.id.pubKey.marshal()))}`)
        console.log(`HOPR:\t\t${chalk.green(node.peerInfo.id.toB58String())}`)
        rl.prompt()
        break
      default:
        console.log(chalk.red('Unknown command!'))
        rl.prompt()
        break
    }
  })
  rl.prompt()
}

process.title = 'hopr'
;(async function main() {
  console.log(`Welcome to ${chalk.bold('HOPR')}!\n`)

  options = parseOptions()

  try {
    node = await Hopr.createNode(HoprPolkadot, options)
  } catch (err) {
    console.log(chalk.red(err.message))
    process.exit(1)
  }

  console.log(`\nAvailable under the following addresses:\n ${node.peerInfo.multiaddrs.toArray().join('\n ')}\n`)

  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    completer: tabCompletion
  })

  rl.on('close', stopNode)

  if (options.bootstrapNode) {
    return runAsBootstrapNode()
  } else {
    return runAsRegularNode()
  }
})()

async function close(query?: string): Promise<any> {
  if (query == null) {
    console.log(chalk.red(`Invalid arguments. Expected 'close <peerId>'. Received '${query}'`))
    setTimeout(() => {
      rl.prompt()
    })
    return
  }

  let peerId: PeerId
  try {
    peerId = await checkPeerIdInput(query)
  } catch (err) {
    console.log(err.message)
    setTimeout(() => {
      rl.prompt()
    })
    return
  }

  const channelId = await node.paymentChannels.utils.getId(
    await node.paymentChannels.utils.pubKeyToAccountId(node.peerInfo.id.pubKey.marshal()),
    await node.paymentChannels.utils.pubKeyToAccountId(peerId.pubKey.marshal()),
    node.paymentChannels.api
  )

  // try {
  //   let interval: NodeJS.Timeout
  //   node.paymentChannels
  //     .closeChannel(channelId)
  //     .then(receivedMoney => {
  //       console.log(
  //         `${chalk.green(`Successfully closed channel`)} ${chalk.yellow(channelId.toString())}. Received ${chalk.magenta(fromWei(receivedMoney, 'ether'))} ETH.`
  //       )
  //       setTimeout(() => {
  //         rl.prompt()
  //       })
  //     })
  //     .catch((err: Error) => {
  //       console.log(err.message)
  //       rl.prompt()
  //     })
  //   // @TODO suppress the message in case of an error
  //   console.log(`Submitted transaction. Waiting for confirmation .`)
  //   interval = setInterval(() => process.stdout.write('.'), 1000)
  // } catch (err) {
  //   console.log(chalk.red(err.message))
  //   rl.prompt()
  // }
  // return
}

async function send(query?: string): Promise<void> {
  return new Promise<void>(async resolve => {
    if (query == null) {
      console.log(chalk.red(`Invalid arguments. Expected 'open <peerId>'. Received '${query}'`))
      setTimeout(() => {
        rl.prompt()
        resolve()
      })
      return
    }

    let peerId: PeerId
    try {
      peerId = await checkPeerIdInput(query)
    } catch (err) {
      console.log(err.message)
      setTimeout(() => {
        rl.prompt()
        resolve()
      })
      return
    }

    rl.question(`Sending message to ${chalk.blue(peerId.toB58String())}\nType in your message and press ENTER to send:\n`, (message: string) =>
      node
        .sendMessage(rlp.encode([message, Date.now().toString()]), peerId)
        .catch((err: Error) => console.log(chalk.red(err.message)))
        .finally(() =>
          setTimeout(() => {
            rl.prompt()
            resolve()
          })
        )
    )
  })
}

async function open(query?: string): Promise<void> {
  if (query == null) {
    console.log(chalk.red(`Invalid arguments. Expected 'open <peerId>'. Received '${query}'`))
    rl.prompt()
    return
  }

  let counterparty: PeerId
  try {
    counterparty = await checkPeerIdInput(query)
  } catch (err) {
    console.log(err.message)
    setTimeout(() => {
      rl.prompt()
    })
    return
  }

  const channelId = node.paymentChannels.utils.getId(
    /* prettier-ignore */
    await node.paymentChannels.utils.pubKeyToAccountId(node.peerInfo.id.pubKey.marshal()),
    await node.paymentChannels.utils.pubKeyToAccountId(counterparty.pubKey.marshal()),
    node.paymentChannels.api
  )

  let interval: NodeJS.Timeout
  node.paymentChannels.channel
    .create(
      node.paymentChannels,
      counterparty.pubKey.marshal(),
      async () => node.paymentChannels.utils.pubKeyToAccountId(await node.interactions.payments.onChainKey.interact(counterparty)),
      new node.paymentChannels.types.ChannelBalance(node.paymentChannels.api.registry, {
        balance: new BN(12345),
        balance_a: new BN(123)
      })
    )
    .then(() => {
      console.log(`${chalk.green(`Successfully opened channel`)} ${chalk.yellow(channelId.toString())}`)
    })
    .catch((err: Error) => {
      console.log(chalk.red(err.message))
    })
    .finally(() => {
      setTimeout(() => {
        rl.prompt()
      })
    })

  process.stdout.write(`Submitted transaction. Waiting for confirmation .`)
  interval = setInterval(() => process.stdout.write('.'), 1000)
}

async function openChannels(): Promise<void> {
  let str = `${chalk.yellow('ChannelId:'.padEnd(64, ' '))} - ${chalk.blue('PeerId:')}\n`

  try {
    str += await node.paymentChannels.channel.getAll(
      node.paymentChannels,
      async (channel: ChannelInstance) => {
        if (!channel.counterparty) {
          return `${chalk.yellow(u8aToHex(await channel.channelId))} - ${chalk.gray('pre-opened')}`
        }

        const peerId = await pubKeyToPeerId(channel.counterparty)

        return `${chalk.yellow(u8aToHex(await channel.channelId))} - ${chalk.blue(peerId.toB58String())}`
      },
      (promises: Promise<string>[]) => {
        if (promises.length == 0) return `\n  No open channels.`

        return Promise.all(promises).then((results: string[]) => results.join('\n'))
      }
    )
  } catch (err) {
    setTimeout(() => {
      rl.prompt()
    })
    return console.log(chalk.red(err.message))
  }

  setTimeout(() => {
    console.log(str)
    rl.prompt()
  })
}

async function stake(query: string): Promise<void> {
  if (!query) {
    console.log(chalk.red(`Invalid arguments. Expected 'stake <amount of ETH>'. Received '${query}'`))
    rl.prompt()
    return
  }

  let amount = new BN(toWei(query, 'ether'))
  if (funds.lt(new BN(amount))) {
    console.log(chalk.red('Insufficient funds.'))
    rl.prompt()
    return
  }

  try {
    // @TODO
    // await sendTransaction(
    //   {
    //     from: ownAddress,
    //     to: process.env['CONTRACT_ADDRESS'],
    //     value: amount.toString(),
    //     gas: STAKE_GAS_AMOUNT
    //   },
    //   node.peerInfo.id,
    //   node.paymentChannels.web3
    // ).then(receipt => {
    //   node.paymentChannels.nonce = node.paymentChannels.nonce + 1
    //   return receipt
    // })
  } catch (err) {
    console.log(chalk.red(err.message))
  } finally {
    setTimeout(() => {
      rl.prompt()
    })
  }
}

async function unstake(query: string): Promise<void> {
  if (query == null) {
    console.log(chalk.red(`Invalid arguments. Expected 'unstake <amount of ETH>'. Received '${query}'`))
    rl.prompt()
    return
  }

  let amount = new BN(toWei(query, 'ether'))
  if (stakedFunds.lt(amount)) {
    console.log(chalk.red('Amount must not be higher than current stake.'))
    rl.prompt()
    return
  }

  try {
    // x    await node.paymentChannels.contractCall(node.paymentChannels.contract.methods.unstakeEther(amount.toString()))
  } catch (err) {
    console.log(chalk.red(err.message))
  } finally {
    setTimeout(() => {
      rl.prompt()
    })
  }
}

async function crawl(): Promise<void> {
  try {
    await node.crawler.crawl((peerInfo: PeerInfo) => isNotBootstrapNode(peerInfo.id))
  } catch (err) {
    console.log(chalk.red(err.message))
  } finally {
    setTimeout(() => {
      rl.prompt()
    })
  }
}

async function closeAll(): Promise<void> {
  try {
    const receivedMoney = await node.paymentChannels.channel.closeChannels(node.paymentChannels)
    console.log(`${chalk.green(`Closed all channels and received`)} ${chalk.magenta(fromWei(receivedMoney.toString(), 'ether'))} ETH.`)
  } catch (err) {
    console.log(chalk.red(err.message))
  } finally {
    setTimeout(() => {
      rl.prompt()
    })
  }
}

async function getStakedEther(): Promise<BN> {
  try {
    // let state = await node.paymentChannels.contract.methods.states(ownAddress).call({ from: ownAddress })
    // console.log(`Current stake: ${chalk.green(fromWei(state.stakedEther, 'ether'))} ETH`)
    // return new BN(state.stakedEther)
  } catch (err) {
    console.log(chalk.red(err.message))
  } finally {
    setTimeout(() => {
      rl.prompt()
    })
  }

  return Promise.resolve(new BN(0))
}