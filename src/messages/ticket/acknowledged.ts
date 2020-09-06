import { u8aConcat, u8aEquals } from '@hoprnet/hopr-utils'

import HoprCoreConnector, { Types } from '@hoprnet/hopr-core-connector-interface'
import PeerId from 'peer-id'
import { Hash } from '@hoprnet/hopr-core-connector-interface/src/types'

class AcknowledgedTicket<Chain extends HoprCoreConnector> extends Uint8Array {
  private _signedTicket: Types.SignedTicket
  private _secretA: Types.Hash
  private _secretB: Types.Hash
  private _preImage: Types.Hash

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
      preImage: Types.Hash
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
      this.set(struct.preImage, this.preImageOffset - this.byteOffset)
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
      this._secretA = new Hash(new Uint8Array(this.buffer, this.secretAOffset, this.paymentChannels.types.Hash.SIZE))
    }

    return this._secretA
  }

  get secretBOffset(): number {
    return this.byteOffset + this.paymentChannels.types.SignedTicket.SIZE + this.paymentChannels.types.Hash.SIZE
  }

  get secretB(): Types.Hash {
    if (this._secretB == null) {
      this._secretB = new Hash(new Uint8Array(this.buffer, this.secretBOffset, this.paymentChannels.types.Hash.SIZE))
    }

    return this._secretB
  }

  get preImageOffset(): number {
    return (
      this.byteOffset +
      this.paymentChannels.types.SignedTicket.SIZE +
      this.paymentChannels.types.Hash.SIZE +
      this.paymentChannels.types.Hash.SIZE
    )
  }

  get preImage(): Types.Hash {
    if (this._preImage == null) {
      this._preImage = new Hash(
        new Uint8Array(this.buffer, this.signedTicketOffset, this.paymentChannels.types.Hash.SIZE)
      )
    }

    return this._preImage
  }

  async verify(peerId: PeerId): Promise<boolean> {
    const signatureOk = (await this.signedTicket).verify(peerId.pubKey.marshal())

    const challengeOk = u8aEquals(await this.computeResponse(), (await this.signedTicket).ticket.challenge)

    return challengeOk && signatureOk
  }

  async isWinning(): Promise<boolean> {
    const luck = await this.paymentChannels.utils.hash(
      u8aConcat(await (await this.signedTicket).ticket.hash, this.preImage, this.secretB)
    )

    return luck < (await this.signedTicket).ticket.winProb
  }

  static SIZE<Chain extends HoprCoreConnector>(hoprCoreConnector: Chain): number {
    return (
      hoprCoreConnector.types.SignedTicket.SIZE +
      hoprCoreConnector.types.Hash.SIZE +
      hoprCoreConnector.types.Hash.SIZE +
      hoprCoreConnector.types.Hash.SIZE
    )
  }

  private async computeResponse(): Promise<Types.Hash> {
    return await this.paymentChannels.utils.hash(u8aConcat(this.secretA, this.secretB))
  }
}

export { AcknowledgedTicket }
