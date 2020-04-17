"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const peer_id_1 = __importDefault(require("peer-id"));
const hopr_utils_1 = require("@hoprnet/hopr-utils");
const PUBLIC_KEY_LENGTH = 37;
class ForwardPacket extends Uint8Array {
    constructor(arr, struct) {
        if (arr != null && struct == null) {
            super(arr.bytes, arr.offset);
            try {
                peer_id_1.default.createFromBytes(Buffer.from(this.destination));
            }
            catch {
                throw Error('Invalid peerId.');
            }
        }
        else if (arr == null && struct != null) {
            super(hopr_utils_1.u8aConcat(struct.destination.marshalPubKey(), struct.sender.marshalPubKey(), struct.payload || new Uint8Array()));
        }
    }
    subarray(begin = 0, end) {
        return new Uint8Array(this.buffer, begin, end != null ? end - begin : undefined);
    }
    get destination() {
        return this.subarray(0, PUBLIC_KEY_LENGTH);
    }
    get sender() {
        return this.subarray(PUBLIC_KEY_LENGTH, PUBLIC_KEY_LENGTH + PUBLIC_KEY_LENGTH);
    }
    get payload() {
        return this.subarray(PUBLIC_KEY_LENGTH + PUBLIC_KEY_LENGTH);
    }
}
exports.ForwardPacket = ForwardPacket;