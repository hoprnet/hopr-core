import type PeerId from 'peer-id';
import type PeerInfo from 'peer-info';
import type Multiaddr from 'multiaddr';
export interface DialOptions {
    signal?: AbortSignal;
    relay?: PeerId | PeerInfo;
}
export declare type Stream = {
    sink: (source: AsyncIterable<Uint8Array>) => void;
    source: AsyncIterable<Uint8Array>;
};
export declare type Handler = {
    stream: Stream;
    connection?: Connection;
    protocol?: string;
};
export interface MultiaddrConnection extends Stream {
    close(err?: Error): Promise<void>;
    conn: any;
    remoteAddr: Multiaddr;
    localAddr?: Multiaddr;
    timeline: {
        open: number;
        close?: number;
    };
}
export interface Upgrader {
    upgradeOutbound(multiaddrConnection: MultiaddrConnection): Promise<Connection>;
    upgradeInbound(multiaddrConnection: MultiaddrConnection): Promise<Connection>;
}
export interface PeerRouting {
    findPeer(peerId: PeerId): Promise<PeerInfo>;
}
export interface Connection {
    localAddr: Multiaddr;
    remoteAddr: Multiaddr;
    localPeer: PeerId;
    remotePeer: PeerId;
    newStream(protocols?: string[]): Promise<{
        protocol: string;
        stream: Stream;
    }>;
    close(): Promise<void>;
    getStreams(): any[];
    stat: {
        direction: 'outbound' | 'inbound';
        timeline: {
            open: number;
            upgraded: number;
        };
        multiplexer?: any;
        encryption?: any;
    };
}
export interface PeerStore {
    has(peerInfo: PeerId): boolean;
    put(peerInfo: PeerInfo, options?: {
        silent: boolean;
    }): PeerInfo;
    peers: Map<string, PeerInfo>;
    remove(peer: PeerId): void;
}
export interface Registrar {
    getConnection(peer: PeerInfo): Connection;
    handle(protocol: string, handler: Handler): void;
}
export interface Dialer {
    connectToPeer(peer: PeerInfo, options?: any): Promise<Connection>;
}
export declare type ConnHandler = (conn: Connection) => void;