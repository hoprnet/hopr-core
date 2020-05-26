"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOpenChannels = exports.getPartyOpenChannels = exports.getMyOpenChannels = exports.getPeers = void 0;
const hopr_utils_1 = require("@hoprnet/hopr-utils");
const utils_1 = require("../../src/utils");
const isBootstrapNode_1 = require("./isBootstrapNode");
/**
 * Get node's peers.
 * @returns an array of peer ids
 */
function getPeers(node) {
    return Array.from(node.peerStore.peers.values())
        .map(peerInfo => peerInfo.id)
        .filter(peerId => {
        return !isBootstrapNode_1.isBootstrapNode(node, peerId);
    });
}
exports.getPeers = getPeers;
/**
 * Get node's open channels by looking into connector's DB.
 * @returns a promise that resolves to an array of peer ids
 */
function getMyOpenChannels(node) {
    return new Promise((resolve, reject) => {
        try {
            let peerIds = [];
            node.paymentChannels.channel.getAll(node.paymentChannels, async (channel) => {
                const pubKey = await channel.offChainCounterparty;
                const peerId = await utils_1.pubKeyToPeerId(pubKey);
                if (!peerIds.includes(peerId)) {
                    peerIds.push(peerId);
                }
            }, async (promises) => {
                await Promise.all(promises);
                return resolve(peerIds);
            });
        }
        catch (err) {
            return reject(err);
        }
    });
}
exports.getMyOpenChannels = getMyOpenChannels;
/**
 * Get node's open channels and a counterParty's using connector's indexer.
 * @returns a promise that resolves to an array of peer ids
 */
async function getPartyOpenChannels(node, party) {
    const { indexer, utils } = node.paymentChannels;
    const accountId = await utils.pubKeyToAccountId(party.pubKey.marshal());
    // get indexed open channels
    const channels = await indexer.get({
        partyA: accountId,
    });
    const channelAccountIds = channels.map(channel => {
        return hopr_utils_1.u8aEquals(channel.partyA, accountId) ? channel.partyB : channel.partyA;
    });
    // get available nodes
    const peers = await Promise.all(getPeers(node).map(async (peer) => {
        return {
            peer,
            accountId: await utils.pubKeyToAccountId(party.pubKey.marshal()),
        };
    }));
    // console.log('party', party.toB58String())
    // console.log('indexer:', channels.length)
    // console.log('peers:', peers.length)
    return peers
        .filter(({ accountId }) => {
        return channelAccountIds.find(channelAccountId => {
            return hopr_utils_1.u8aEquals(accountId, channelAccountId);
        });
    })
        .map(peer => peer.peer);
}
exports.getPartyOpenChannels = getPartyOpenChannels;
/**
 * Get node's open channels with a counterParty using connector's DB or indexer if supported.
 * @returns a promise that resolves to an array of peer ids
 */
async function getOpenChannels(node, partyPeerId) {
    const supportsIndexer = typeof node.paymentChannels.indexer !== 'undefined';
    const partyIfSelf = node.peerInfo.id.equals(partyPeerId);
    if (supportsIndexer) {
        // if connector supports indexeer
        return getPartyOpenChannels(node, partyPeerId);
    }
    else if (partyIfSelf) {
        // if party is self, and indexer not supported
        return getMyOpenChannels(node);
    }
    else {
        // return an emptry array if connector does not support indexer
        return [];
    }
}
exports.getOpenChannels = getOpenChannels;
//# sourceMappingURL=openChannels.js.map