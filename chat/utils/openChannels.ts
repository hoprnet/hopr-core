import type PeerId from 'peer-id'
import type HoprCoreConnector from '@hoprnet/hopr-core-connector-interface'
import type { Channel as ChannelInstance } from '@hoprnet/hopr-core-connector-interface'
import type Hopr from '../../src'
import { u8aEquals } from '@hoprnet/hopr-utils'
import { pubKeyToPeerId } from '../../src/utils'
import { isBootstrapNode } from './isBootstrapNode'

/**
 * Get node's peers.
 * @returns an array of peer ids
 */
export function getPeers(node: Hopr<HoprCoreConnector>): PeerId[] {
  return Array.from(node.peerStore.peers.values())
    .map(peerInfo => peerInfo.id)
    .filter(peerId => {
      return !isBootstrapNode(node, peerId)
    })
}

/**
 * Get node's open channels by looking into connector's DB.
 * @returns a promise that resolves to an array of peer ids
 */
export function getMyOpenChannels(node: Hopr<HoprCoreConnector>): Promise<PeerId[]> {
  return new Promise<PeerId[]>((resolve, reject) => {
    try {
      let peerIds: PeerId[] = []

      node.paymentChannels.channel.getAll(
        node.paymentChannels,
        async (channel: ChannelInstance<HoprCoreConnector>) => {
          const pubKey = await channel.offChainCounterparty
          const peerId = await pubKeyToPeerId(pubKey)

          if (!peerIds.includes(peerId)) {
            peerIds.push(peerId)
          }
        },
        async (promises: Promise<void>[]) => {
          await Promise.all(promises)
          return resolve(peerIds)
        }
      )
    } catch (err) {
      return reject(err)
    }
  })
}

/**
 * Get node's open channels and a counterParty's using connector's indexer.
 * @returns a promise that resolves to an array of peer ids
 */
export async function getPartyOpenChannels(node: Hopr<HoprCoreConnector>, party: PeerId): Promise<PeerId[]> {
  const { indexer, utils } = node.paymentChannels
  const accountId = await utils.pubKeyToAccountId(party.pubKey.marshal())

  // get indexed open channels
  const channels = await indexer.get({
    partyA: accountId,
  })
  const channelAccountIds = channels.map(channel => {
    return u8aEquals(channel.partyA, accountId) ? channel.partyB : channel.partyA
  })

  // get available nodes
  const peers = await Promise.all(
    getPeers(node).map(async peer => {
      return {
        peer,
        accountId: await utils.pubKeyToAccountId(party.pubKey.marshal()),
      }
    })
  )

  // console.log('party', party.toB58String())
  // console.log('indexer:', channels.length)
  // console.log('peers:', peers.length)

  return peers
    .filter(({ accountId }) => {
      return channelAccountIds.find(channelAccountId => {
        return u8aEquals(accountId, channelAccountId)
      })
    })
    .map(peer => peer.peer)
}

/**
 * Get node's open channels with a counterParty using connector's DB or indexer if supported.
 * @returns a promise that resolves to an array of peer ids
 */
export async function getOpenChannels(node: Hopr<HoprCoreConnector>, partyPeerId: PeerId): Promise<PeerId[]> {
  const supportsIndexer = typeof node.paymentChannels.indexer !== 'undefined'
  const partyIfSelf = node.peerInfo.id.equals(partyPeerId)

  if (supportsIndexer) {
    // if connector supports indexeer
    return getPartyOpenChannels(node, partyPeerId)
  } else if (partyIfSelf) {
    // if party is self, and indexer not supported
    return getMyOpenChannels(node)
  } else {
    // return an emptry array if connector does not support indexer
    return []
  }
}
