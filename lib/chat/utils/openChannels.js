"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hopr_utils_1 = require("@hoprnet/hopr-utils");
const utils_1 = require("../../src/utils");
const isBootstrapNode_1 = require("./isBootstrapNode");
function getNodes(node) {
    return Array.from(node.peerStore.peers.values()).filter(peerInfo => {
        return isBootstrapNode_1.isBootstrapNode(node, peerInfo.id);
    });
}
function getMyOpenChannelPeerIds(node) {
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
exports.getMyOpenChannelPeerIds = getMyOpenChannelPeerIds;
async function getPartyOpenChannelPeerIds(node, partyPeerId) {
    const { indexer, utils } = node.paymentChannels;
    const pubKey = partyPeerId.marshalPubKey();
    const accountId = await utils.pubKeyToAccountId(pubKey);
    // get indexed open channels
    const channels = await indexer.get({
        partyA: accountId,
    });
    const channelAccountIds = channels.map(channel => {
        return hopr_utils_1.u8aEquals(channel.partyA, accountId) ? channel.partyB : channel.partyA;
    });
    // get available nodes
    const nodes = getNodes(node);
    const nodeAccountIds = await Promise.all(nodes.map(async (node) => {
        return {
            node,
            accountId: await utils.pubKeyToAccountId(node.id.marshalPubKey()),
        };
    }));
    return nodeAccountIds
        .filter(({ accountId }) => {
        return channelAccountIds.find(channelAccountId => {
            return hopr_utils_1.u8aEquals(accountId, channelAccountId);
        });
    })
        .map(node => node.node.id);
}
exports.getPartyOpenChannelPeerIds = getPartyOpenChannelPeerIds;
async function getOpenChannelPeerIds(node, partyPeerId) {
    const supportsIndexer = typeof node.paymentChannels.indexer !== 'undefined';
    const partyIfSelf = node.peerInfo.id.equals(partyPeerId);
    if (partyIfSelf) {
        // if party is self, prefer to use 'getMyOpenChannelPeerIds'
        return getMyOpenChannelPeerIds(node);
    }
    else if (supportsIndexer) {
        // if connector supports indexeer
        return getPartyOpenChannelPeerIds(node, partyPeerId);
    }
    else {
        // return an emptry array if connector does not support indexer
        return [];
    }
}
exports.getOpenChannelPeerIds = getOpenChannelPeerIds;
//# sourceMappingURL=openChannels.js.map