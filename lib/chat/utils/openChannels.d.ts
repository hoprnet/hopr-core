import type PeerId from 'peer-id';
import type HoprCoreConnector from '@hoprnet/hopr-core-connector-interface';
import type Hopr from '../../src';
export declare function getMyOpenChannelPeerIds(node: Hopr<HoprCoreConnector>): Promise<PeerId[]>;
export declare function getPartyOpenChannelPeerIds(node: Hopr<HoprCoreConnector>, partyPeerId: PeerId): Promise<PeerId[]>;
export declare function getOpenChannelPeerIds(node: Hopr<HoprCoreConnector>, partyPeerId: PeerId): Promise<PeerId[]>;
