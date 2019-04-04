'use strict'

const Transaction = require('../../transaction')

const { parallel } = require('neo-async')

const { PROTOCOL_PAYMENT_CHANNEL } = require('../../constants')
const pull = require('pull-stream')
const lp = require('pull-length-prefixed')
const { sign } = require('secp256k1')
const { pubKeyToEthereumAddress, numberToBuffer, bufferToNumber, log } = require('../../utils')
const { fromWei } = require('web3-utils')
const BN = require('bn.js')

const { SIGNATURE_LENGTH } = require('../../transaction')

module.exports = (node) => {
    async function handleOpeningRequest(data, cb) {
        if (data.length !== Transaction.SIZE)
            return cb()

        const restoreTx = Transaction.fromBuffer(data)

        if (bufferToNumber(restoreTx.index) !== 1)
            return cb()

        const counterparty = restoreTx.counterparty
        const channelId = restoreTx.getChannelId(node.peerInfo.id)

        try {
            await node.db.get(node.paymentChannels.StashedRestoreTransaction(channelId))
            return
        } catch (err) {
            if (!err.notFound)
                return cb(err)
        }

        const batch = new node.paymentChannels.web3.BatchRequest()

        parallel({
            state: (cb) => batch.add(node.paymentChannels.contract.methods.states(pubKeyToEthereumAddress(counterparty)).call.request({
                from: pubKeyToEthereumAddress(node.peerInfo.id.pubKey.marshal())
            }, 'latest', cb)),
            channel: (cb) => batch.add(node.paymentChannels.contract.methods.channels(channelId).call.request({
                from: pubKeyToEthereumAddress(node.peerInfo.id.pubKey.marshal())
            }, 'latest', cb))
        }, async (err, { state, channel }) => {
            if (err)
                return cb(err)

            if (!state.isSet)
                return cb(Error(`Rejecting payment channel opening request because counterparty hasn't staked any funds.`))

            const stakedEther = new BN(state.stakedEther)
            const claimedFunds = new BN(restoreTx.value)

            // Check whether the counterparty has staked enough money to open
            // the payment channel
            if (stakedEther.lt(claimedFunds))
                return cb(Error(`Rejecting payment channel opening request due to ${fromWei(claimedFunds.sub(stakedEther), 'ether')} ETH too less staked funds.`))

            // Check whether there is already such a channel registered in the
            // smart contract
            state = parseInt(channel.state)
            if (!Number.isInteger(state) || state < 0)
                return cb(Error(`Invalid state. Got ${state.toString()} instead.`))

            await node.db.put(node.paymentChannels.StashedRestoreTransaction(channelId), restoreTx.toBuffer(), { sync: true })

            node.paymentChannels.registerOpeningListener(channelId)
            node.paymentChannels.registerSettlementListener(channelId)

            const sigRestore = sign(restoreTx.hash, node.peerInfo.id.privKey.marshal())

            return cb(null, Buffer.concat([sigRestore.signature, numberToBuffer(sigRestore.recovery, 1)], SIGNATURE_LENGTH + 1))
        })

        batch.execute()
    }

    node.handle(PROTOCOL_PAYMENT_CHANNEL, (protocol, conn) => pull(
        conn,
        lp.decode({
            maxLength: Transaction.SIZE
        }),
        pull.asyncMap(handleOpeningRequest),
        pull.filter(data => Buffer.isBuffer(data)),
        lp.encode(),
        conn
    ))
}