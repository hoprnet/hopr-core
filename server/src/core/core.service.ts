import { Injectable } from '@nestjs/common';
import { default as connector } from '@hoprnet/hopr-core-ethereum'
import Hopr from '@hoprnet/hopr-core'
import type { HoprOptions } from '@hoprnet/hopr-core'
import type HoprCoreConnector from '@hoprnet/hopr-core-connector-interface'
import { ParserService } from './parser/parser.service';
import PeerInfo from 'peer-info';

@Injectable()
export class CoreService {
    private node: Hopr<HoprCoreConnector>

    constructor(private parserService: ParserService) {}
    
    async start() {
        try {
        const options: HoprOptions = {
            debug: true,
            bootstrapNode: false,
            network: 'ethereum',
            connector,
            bootstrapServers: [await this.parserService.parseBootstrap('/ip4/34.65.114.152/tcp/9091/p2p/16Uiu2HAmQrtY26aYgLBUMjhw9qvZABKYTdncHR5VD4MDrMLVSpkp') as PeerInfo],
            provider: 'wss://kovan.infura.io/ws/v3/f7240372c1b442a6885ce9bb825ebc36',
            hosts: await this.parserService.parseHost('0.0.0.0:9091') as HoprOptions['hosts'],
            password: 'switzerland',
            output: this.parserService.outputFunctor()
        }
        console.log(':: HOPR Options ::', options);
        console.log(':: Starting HOPR Core Node ::')
        this.node = await Hopr.create(options);
        console.log(':: HOPR Core Node Started ::')
        return { status: 'ok' }
        } catch (err) {
        return { error: err }
        }
    }

    async stop() {
        try {
            console.log(':: Stopping HOPR Core Node ::')
            await this.node.stop()
            console.log(':: HOPR Core Node Stopped ::')
            return { status: 'ok' }
        } catch (err) {
            return { error: err }
        }
        
    }
}
