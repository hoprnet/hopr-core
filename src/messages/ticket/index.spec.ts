import assert from 'assert'

import { randomBytes } from 'crypto'

import { AcknowledgedTicket, UnacknowledgedTicket } from '.'

import HoprCoreConnector from '@hoprnet/hopr-core-connector-interface'

import { NODE_SEEDS } from '@hoprnet/hopr-demo-seeds'

import { Types, Utils } from '@hoprnet/hopr-core-ethereum'
import { privKeyToPeerId } from '../../utils'
import { u8aConcat } from '@hoprnet/hopr-utils'

describe(`check serialization and deserialization of ticket objects`, function () {
  function getConnector(): HoprCoreConnector {
    return ({
      utils: Utils,
      types: new Types(),
    } as unknown) as HoprCoreConnector
  }
  it('should create a winning ticket', async function () {
    const connector = getConnector()

    const peerA = await privKeyToPeerId(NODE_SEEDS[0])
    const peerB = await privKeyToPeerId(NODE_SEEDS[1])

    const accountA = await connector.utils.pubKeyToAccountId(peerA.pubKey.marshal())
    const accountB = await connector.utils.pubKeyToAccountId(peerB.pubKey.marshal())

    const channelId = await connector.utils.getId(accountA, accountB)

    const secretA = randomBytes(32)
    const secretB = randomBytes(32)
    const response = await connector.utils.hash(u8aConcat(secretA, secretB))
    const challenge = await connector.utils.hash(response)

    const dbEntry = new UnacknowledgedTicket(connector)

    const signedTicket = await connector.types.SignedTicket.create({
      bytes: dbEntry.buffer,
      offset: dbEntry.signedTicketOffset,
    })

    const ticket = connector.types.Ticket.create(
      {
        bytes: signedTicket.buffer,
        offset: signedTicket.ticketOffset,
      },
      {
        amount: new connector.types.Balance(1),
        channelId,
        challenge,
        epoch: new connector.types.TicketEpoch(0),
        winProb: new connector.types.Hash(new Uint8Array(32).fill(0xff)),
      }
    )

    await ticket.sign(peerA.privKey.marshal(), undefined, {
      bytes: signedTicket.buffer,
      offset: signedTicket.signatureOffset,
    })

    assert(await dbEntry.verifySignature(peerA), 'signature must be valid')

    const acknowledgedDbEntry = new AcknowledgedTicket(connector, undefined, {
      signedTicket,
      response: await connector.utils.hash(u8aConcat(secretA, secretB)),
      preImage: randomBytes(32),
      redeemed: false,
    })

    assert(await acknowledgedDbEntry.verify(peerA))
  })
})
