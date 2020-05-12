import type PeerId from 'peer-id'
import type HoprCoreConnector from '@hoprnet/hopr-core-connector-interface'
import type { Channel as ChannelInstance } from '@hoprnet/hopr-core-connector-interface'
import type Hopr from '../../src'
import { u8aEquals } from '@hoprnet/hopr-utils'
import { pubKeyToPeerId } from '../../src/utils'
import { isBootstrapNode } from './isBootstrapNode'

function getNodes(node: Hopr<HoprCoreConnector>) {
  return Array.from(node.peerStore.peers.values()).filter(peerInfo => {
    return isBootstrapNode(node, peerInfo.id)
  })
}

export function getMyOpenChannelPeerIds(node: Hopr<HoprCoreConnector>): Promise<PeerId[]> {
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

export async function getPartyOpenChannelPeerIds(
  node: Hopr<HoprCoreConnector>,
  partyPeerId: PeerId
): Promise<PeerId[]> {
  const { indexer, utils } = node.paymentChannels
  const pubKey = partyPeerId.marshalPubKey()
  const accountId = await utils.pubKeyToAccountId(pubKey)

  // get indexed open channels
  const channels = await indexer.get({
    partyA: accountId,
  })
  const channelAccountIds = channels.map(channel => {
    return u8aEquals(channel.partyA, accountId) ? channel.partyB : channel.partyA
  })

  // get available nodes
  const nodes = getNodes(node)
  const nodeAccountIds = await Promise.all(
    nodes.map(async node => {
      return {
        node,
        accountId: await utils.pubKeyToAccountId(node.id.marshalPubKey()),
      }
    })
  )

  return nodeAccountIds
    .filter(({ accountId }) => {
      return channelAccountIds.find(channelAccountId => {
        return u8aEquals(accountId, channelAccountId)
      })
    })
    .map(node => node.node.id)
}

export async function getOpenChannelPeerIds(
  node: Hopr<HoprCoreConnector>,
  partyPeerId: PeerId
): Promise<PeerId[]> {
  const supportsIndexer = typeof node.paymentChannels.indexer !== 'undefined'
  const partyIfSelf = node.peerInfo.id.equals(partyPeerId)

  if (partyIfSelf) {
    // if party is self, prefer to use 'getMyOpenChannelPeerIds'
    return getMyOpenChannelPeerIds(node)
  } else if (supportsIndexer) {
    // if connector supports indexeer
    return getPartyOpenChannelPeerIds(node, partyPeerId)
  } else {
    // return an emptry array if connector does not support indexer
    return []
  }
}
