import { u8aConcat, u8aEquals } from '@hoprnet/hopr-utils'

import HoprCoreConnector, { Types } from '@hoprnet/hopr-core-connector-interface'
import PeerId from 'peer-id'
import { Hash } from '@hoprnet/hopr-core-connector-interface/src/types'

/**
 * This class encapsulates the message that is sent back to the relayer
 * and allows that party to compute the key that is necessary to redeem
 * the previously received transaction.
 */
class AcknowledgedTicket<Chain extends HoprCoreConnector> extends Uint8Array {
  private _signedTicket: Types.SignedTicket
  private _secretA: Types.Hash
  private _secretB: Types.Hash

  private paymentChannels: Chain

  constructor(
    paymentChannels: Chain,
    arr?: {
      bytes: ArrayBuffer
      offset: number
    },
    struct?: {
      signedTicket: Types.SignedTicket
      secretA: Types.Hash
      secretB: Types.Hash
    }
  ) {
    if (arr == null) {
      super(AcknowledgedTicket.SIZE(paymentChannels))
    } else {
      super(arr.bytes, arr.offset, AcknowledgedTicket.SIZE(paymentChannels))
    }

    if (struct != null) {
      this.set(struct.signedTicket, this.signedTicketOffset - this.byteOffset)
      this.set(struct.secretA, this.secretAOffset - this.byteOffset)
      this.set(struct.secretB, this.secretBOffset - this.byteOffset)
    }

    this.paymentChannels = paymentChannels
  }

  subarray(begin: number = 0, end: number = AcknowledgedTicket.SIZE(this.paymentChannels)): Uint8Array {
    return new Uint8Array(this.buffer, begin + this.byteOffset, end - begin)
  }

  get signedTicketOffset(): number {
    return this.byteOffset
  }

  get signedTicket(): Promise<Types.SignedTicket> {
    if (this._signedTicket != null) {
      return Promise.resolve(this._signedTicket)
    }

    return new Promise<Types.SignedTicket>(async (resolve) => {
      this._signedTicket = await this.paymentChannels.types.SignedTicket.create({
        bytes: this.buffer,
        offset: this.signedTicketOffset,
      })

      resolve(this._signedTicket)
    })
  }

  get secretAOffset(): number {
    return this.byteOffset + this.paymentChannels.types.SignedTicket.SIZE
  }

  get secretA(): Types.Hash {
    if (this._secretA == null) {
      this._secretA = new Hash(
        new Uint8Array(this.buffer, this.signedTicketOffset, this.paymentChannels.types.Hash.SIZE)
      )
    }

    return this._secretA
  }

  get secretBOffset(): number {
    return this.byteOffset + this.paymentChannels.types.SignedTicket.SIZE + this.paymentChannels.types.Hash.SIZE
  }

  get secretB(): Types.Hash {
    if (this._secretB == null) {
      this._secretB = new Hash(
        new Uint8Array(this.buffer, this.signedTicketOffset, this.paymentChannels.types.Hash.SIZE)
      )
    }

    return this._secretB
  }

  async verify(peerId: PeerId): Promise<boolean> {
    const signatureOk = (await this.signedTicket).verify(peerId.pubKey.marshal())

    const challengeOk = u8aEquals(
      await this.paymentChannels.utils.hash(u8aConcat(this.secretA, this.secretB)),
      (await this.signedTicket).ticket.challenge
    )

    return challengeOk && signatureOk
  }

  static SIZE<Chain extends HoprCoreConnector>(hoprCoreConnector: Chain): number {
    return (
      hoprCoreConnector.types.SignedTicket.SIZE + hoprCoreConnector.types.Hash.SIZE + hoprCoreConnector.types.Hash.SIZE
    )
  }
}

export { AcknowledgedTicket }
