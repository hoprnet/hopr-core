/* eslint-disable */
import { Reader, Writer } from 'protobufjs/minimal';


export interface PingRequest {
  peerId: string;
}

export interface PingResponse {
  latency: number;
}

const basePingRequest: object = {
  peerId: "",
};

const basePingResponse: object = {
  latency: 0,
};

export interface Ping {

  Ping(request: PingRequest): Promise<PingResponse>;

}

export class PingClientImpl implements Ping {

  private readonly rpc: Rpc;

  constructor(rpc: Rpc) {
    this.rpc = rpc;
  }

  Ping(request: PingRequest): Promise<PingResponse> {
    const data = PingRequest.encode(request).finish();
    const promise = this.rpc.request("ping.Ping", "Ping", data);
    return promise.then(data => PingResponse.decode(new Reader(data)));
  }

}

interface Rpc {

  request(service: string, method: string, data: Uint8Array): Promise<Uint8Array>;

}

export const PingRequest = {
  encode(message: PingRequest, writer: Writer = Writer.create()): Writer {
    writer.uint32(10).string(message.peerId);
    return writer;
  },
  decode(input: Uint8Array | Reader, length?: number): PingRequest {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...basePingRequest } as PingRequest;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.peerId = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },
  fromJSON(object: any): PingRequest {
    const message = { ...basePingRequest } as PingRequest;
    if (object.peerId !== undefined && object.peerId !== null) {
      message.peerId = String(object.peerId);
    } else {
      message.peerId = "";
    }
    return message;
  },
  fromPartial(object: DeepPartial<PingRequest>): PingRequest {
    const message = { ...basePingRequest } as PingRequest;
    if (object.peerId !== undefined && object.peerId !== null) {
      message.peerId = object.peerId;
    } else {
      message.peerId = "";
    }
    return message;
  },
  toJSON(message: PingRequest): unknown {
    const obj: any = {};
    obj.peerId = message.peerId || "";
    return obj;
  },
};

export const PingResponse = {
  encode(message: PingResponse, writer: Writer = Writer.create()): Writer {
    writer.uint32(8).int32(message.latency);
    return writer;
  },
  decode(input: Uint8Array | Reader, length?: number): PingResponse {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...basePingResponse } as PingResponse;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.latency = reader.int32();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },
  fromJSON(object: any): PingResponse {
    const message = { ...basePingResponse } as PingResponse;
    if (object.latency !== undefined && object.latency !== null) {
      message.latency = Number(object.latency);
    } else {
      message.latency = 0;
    }
    return message;
  },
  fromPartial(object: DeepPartial<PingResponse>): PingResponse {
    const message = { ...basePingResponse } as PingResponse;
    if (object.latency !== undefined && object.latency !== null) {
      message.latency = object.latency;
    } else {
      message.latency = 0;
    }
    return message;
  },
  toJSON(message: PingResponse): unknown {
    const obj: any = {};
    obj.latency = message.latency || 0;
    return obj;
  },
};

type Builtin = Date | Function | Uint8Array | string | number | undefined;
type DeepPartial<T> = T extends Builtin
  ? T
  : T extends Array<infer U>
  ? Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U>
  ? ReadonlyArray<DeepPartial<U>>
  : T extends {}
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;