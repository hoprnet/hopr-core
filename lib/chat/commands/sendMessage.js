"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const utils_1 = require("../utils");
const hopr_utils_1 = require("@hoprnet/hopr-utils");
const utils_2 = require("../utils");
const constants_1 = require("../../src/constants");
const readline_1 = __importDefault(require("readline"));
class SendMessage {
    constructor(node) {
        this.node = node;
    }
    /**
     * Encapsulates the functionality that is executed once the user decides to send a message.
     * @param query peerId string to send message to
     */
    async execute(rl, query) {
        if (query == null) {
            console.log(chalk_1.default.red(`Invalid arguments. Expected 'send <peerId>'. Received '${query}'`));
            return;
        }
        let peerId;
        try {
            peerId = await utils_1.checkPeerIdInput(query);
        }
        catch (err) {
            console.log(chalk_1.default.red(err.message));
            return;
        }
        // @ts-ignore
        const oldCompleter = rl.completer;
        // @ts-ignore
        rl.completer = undefined;
        const manualIntermediateNodesQuestion = `Do you want to manually set the intermediate nodes? (${chalk_1.default.green('y')}, ${chalk_1.default.red('N')}): `;
        const manualIntermediateNodesAnswer = await new Promise(resolve => rl.question(manualIntermediateNodesQuestion, resolve));
        hopr_utils_1.clearString(manualIntermediateNodesQuestion + manualIntermediateNodesAnswer, rl);
        const manualPath = (manualIntermediateNodesAnswer.toLowerCase().match(/^y(es)?$/i) || '').length;
        const messageQuestion = `${chalk_1.default.yellow(`Type in your message and press ENTER to send:`)}\n`;
        const message = await new Promise(resolve => rl.question(messageQuestion, resolve));
        hopr_utils_1.clearString(messageQuestion + message, rl);
        console.log(`Sending message to ${chalk_1.default.blue(query)} ...`);
        try {
            if (manualPath) {
                await this.node.sendMessage(utils_1.encodeMessage(message), peerId, () => this.selectIntermediateNodes(rl));
            }
            else {
                await this.node.sendMessage(utils_1.encodeMessage(message), peerId);
            }
        }
        catch (err) {
            console.log(chalk_1.default.red(err.message));
        }
    }
    async complete(line, cb, query) {
        const peerInfos = [];
        for (const peerInfo of this.node.peerStore.peers.values()) {
            if ((!query || peerInfo.id.toB58String().startsWith(query)) && !utils_1.isBootstrapNode(this.node, peerInfo.id)) {
                peerInfos.push(peerInfo);
            }
        }
        if (!peerInfos.length) {
            console.log(chalk_1.default.red(`\nDoesn't know any other node except apart from bootstrap node${this.node.bootstrapServers.length == 1 ? '' : 's'}!`));
            return cb(undefined, [[''], line]);
        }
        return cb(undefined, [peerInfos.map((peerInfo) => `send ${peerInfo.id.toB58String()}`), line]);
    }
    async selectIntermediateNodes(rl) {
        let done = false;
        let selected = [];
        while (!done) {
            console.log(chalk_1.default.yellow(`Please select intermediate node ${selected.length}: (leave empty for no hops)`));
            const lastSelected = selected.length > 0 ? selected[selected.length - 1] : this.node.peerInfo.id;
            const openChannels = await utils_2.getOpenChannels(this.node, lastSelected);
            const validPeers = openChannels.map(peer => peer.toB58String());
            if (validPeers.length === 0) {
                console.log(chalk_1.default.yellow(`No peers with open channels found, you may enter a peer manually.`));
            }
            // detach old prompt
            // @ts-ignore
            const oldPrompt = rl._prompt;
            // @ts-ignore
            const oldCompleter = rl.completer;
            const oldListeners = rl.listeners('line');
            rl.removeAllListeners('line');
            // attach new prompt
            rl.setPrompt('');
            // @ts-ignore
            rl.completer = (line, cb) => {
                console.log('completer', validPeers);
                return cb(undefined, [validPeers.filter(peerId => peerId.startsWith(line)), line]);
            };
            // wait for peerId to be selected
            const peerId = await new Promise(resolve => rl.on('line', async (query) => {
                if (query == null || query === '\n' || query === '' || query.length == 0) {
                    rl.removeAllListeners('line');
                    return resolve(undefined);
                }
                let peerId;
                try {
                    peerId = await utils_1.checkPeerIdInput(query);
                }
                catch (err) {
                    console.log(chalk_1.default.red(err.message));
                }
                readline_1.default.moveCursor(process.stdout, -rl.line, -1);
                readline_1.default.clearLine(process.stdout, 0);
                console.log(chalk_1.default.blue(query));
                return resolve(peerId);
            }));
            if (typeof peerId === 'undefined') {
                done = true;
            }
            else {
                selected.push(peerId);
                if (selected.length >= constants_1.MAX_HOPS - 1) {
                    done = true;
                }
            }
            rl.setPrompt(oldPrompt);
            // @ts-ignore
            rl.completer = oldCompleter;
            // @ts-ignore
            oldListeners.forEach(oldListener => rl.on('line', oldListener));
        }
        return selected;
    }
}
exports.default = SendMessage;
//# sourceMappingURL=sendMessage.js.map