'use strict'

const BN = require('bn.js')

const { log, pubKeyToEthereumAddress } = require('../../utils')
const Transaction = require('../../transaction')

const VALUE_LENGTH = 32

module.exports = (self) => async (err, event) => {
    if (err) {
        console.log(err)
        return
    }

    const channelId = Buffer.from(event.raw.topics[1].slice(2), 'hex')

    let restoreTx
    try {
        restoreTx = Transaction.fromBuffer(await self.node.db.get(self.StashedRestoreTransaction(channelId)))
    } catch (err) {
        if (err.notFound) 
            throw Error(`${self.node.peerInfo.id.toB58String()} Opening request of channel ${channelId.toString('hex')} not found.`)

        throw err
    }

    const channel = await self.contract.methods.channels(channelId).call({
        from: pubKeyToEthereumAddress(self.node.peerInfo.id.pubKey.marshal())
    })

    self.node.db.batch()
        .put(self.RestoreTransaction(channelId), restoreTx.toBuffer())
        .put(self.Index(channelId), restoreTx.index)
        .put(self.CurrentValue(channelId), (new BN(channel.balanceA)).toBuffer('be', VALUE_LENGTH))
        .put(self.TotalBalance(channelId), (new BN(channel.balance)).toBuffer('be', VALUE_LENGTH))
        .del(self.StashedRestoreTransaction(channelId))
        .write({ sync: true })
        .then(() => {
            log(self.node.peerInfo.id, `Opened payment channel \x1b[33m${channelId.toString('hex')}\x1b[0m with txHash \x1b[32m${event.transactionHash}\x1b[0m. Nonce is now \x1b[31m${self.nonce - 1}\x1b[0m.`)
            self.emit(`opened ${channelId.toString('base64')}`, restoreTx)
        })
        .catch((err) => {
            console.log(err)
        })
}