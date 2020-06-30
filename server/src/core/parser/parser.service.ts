import { Injectable } from '@nestjs/common';
import multiaddr from 'multiaddr';
import PeerId from 'peer-id';
import PeerInfo from 'peer-info';

type ParserError = {
  readonly message: string;
};

@Injectable()
export class ParserService {
  async parseBootstrap(
    bootstrapServer: string,
  ): Promise<ParserError | PeerInfo> {
    const bootstrapMultiAddress = multiaddr(bootstrapServer.trim());
    const peerId = bootstrapMultiAddress.getPeerId();
    const translatedPeerId = PeerId.createFromB58String(peerId);
    return PeerInfo.create(translatedPeerId).catch(err => ({ message: err }));
  }
}
