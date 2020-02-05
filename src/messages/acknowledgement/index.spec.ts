import assert from 'assert'
import PeerId from 'peer-id'
import Acknowledgement from '.'
import { Challenge } from '../packet/challenge'
import BN from 'bn.js'
import { Utils, Types } from '@hoprnet/hopr-core-polkadot'
import { HoprCoreConnectorInstance } from '@hoprnet/hopr-core-connector-interface'
import { randomBytes } from 'crypto'
import secp256k1 from 'secp256k1'

describe('test acknowledgement generation', function() {
  it('should generate a valid acknowledgement', async function() {
    const paymentChannels = ({
      utils: Utils,
      types: Types
    } as unknown) as HoprCoreConnectorInstance

    const sender = await PeerId.create({
      keyType: 'secp256k1'
    })

    const receiver = await PeerId.create({
      keyType: 'secp256k1'
    })

    const secret = randomBytes(32)

    const challenge = await Challenge.create(paymentChannels, secret, new BN(0)).sign(sender)
    assert(await challenge.verify(sender), `Previously generated challenge should be valid.`)

    const pubKey = sender.pubKey.marshal()
    assert(
      (await challenge.counterparty).every((value: number, index: number) => pubKey[index] == value),
      `recovered pubKey should be equal.`
    )

    const ack = await Acknowledgement.create(paymentChannels, challenge, secp256k1.publicKeyCreate(secret), receiver)

    assert(await ack.verify(receiver), `Previously generated acknowledgement should be valid.`)
    assert(
      ack.responseSigningParty.every((value: number, index: number) => receiver.pubKey.marshal()[index] == value),
      `recovered pubKey should be equal.`
    )

    assert
  })
})