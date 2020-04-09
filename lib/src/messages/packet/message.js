"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../../constants");
const header_1 = require("./header");
const utils_1 = require("../../utils");
exports.PADDING = new TextEncoder().encode('PADDING');
class Message extends Uint8Array {
    constructor(arr, encrypted) {
        super(arr.bytes, arr.offset, constants_1.PACKET_SIZE);
        this.encrypted = encrypted;
    }
    static get SIZE() {
        return constants_1.PACKET_SIZE;
    }
    subarray(begin = 0, end = Message.SIZE) {
        return new Uint8Array(this.buffer, begin + this.byteOffset, end - begin);
    }
    get plaintext() {
        if (this.encrypted) {
            throw Error(`Cannot read encrypted data.`);
        }
        return utils_1.lengthPrefixedToU8a(this, exports.PADDING, constants_1.PACKET_SIZE);
    }
    get ciphertext() {
        if (!this.encrypted) {
            throw Error(`Message is unencrypted. Cannot read encrypted data.`);
        }
        return this;
    }
    static createEncrypted(msg) {
        return new Message({
            bytes: msg.buffer,
            offset: 0
        }, true);
    }
    static createPlain(msg) {
        if (typeof msg == 'string') {
            msg = new TextEncoder().encode(msg);
        }
        return new Message({
            bytes: utils_1.toLengthPrefixedU8a(msg, exports.PADDING, constants_1.PACKET_SIZE),
            offset: 0
        }, false);
    }
    onionEncrypt(secrets) {
        if (!Array.isArray(secrets) || secrets.length <= 0) {
            throw Error('Invald input arguments. Expected array with at least one secret key.');
        }
        this.encrypted = true;
        for (let i = secrets.length; i > 0; i--) {
            const { key, iv } = header_1.deriveCipherParameters(secrets[i - 1]);
            utils_1.PRP.createPRP(key, iv).permutate(this.subarray());
        }
        return this;
    }
    decrypt(secret) {
        const { key, iv } = header_1.deriveCipherParameters(secret);
        utils_1.PRP.createPRP(key, iv).inverse(this.subarray());
        return this;
    }
}
exports.default = Message;