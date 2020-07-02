/* eslint-disable */
import { Reader, Writer } from 'protobufjs/minimal';


export interface ShutdownRequest {
}

export interface ShutdownResponse {
  timestamp: number;
}

const baseShutdownRequest: object = {
};

const baseShutdownResponse: object = {
  timestamp: 0,
};

export interface Shutdown {

  Shutdown(request: ShutdownRequest): Promise<ShutdownResponse>;

}

export class ShutdownClientImpl implements Shutdown {

  private readonly rpc: Rpc;

  constructor(rpc: Rpc) {
    this.rpc = rpc;
  }

  Shutdown(request: ShutdownRequest): Promise<ShutdownResponse> {
    const data = ShutdownRequest.encode(request).finish();
    const promise = this.rpc.request("shutdown.Shutdown", "Shutdown", data);
    return promise.then(data => ShutdownResponse.decode(new Reader(data)));
  }

}

interface Rpc {

  request(service: string, method: string, data: Uint8Array): Promise<Uint8Array>;

}

export const ShutdownRequest = {
  encode(_: ShutdownRequest, writer: Writer = Writer.create()): Writer {
    return writer;
  },
  decode(input: Uint8Array | Reader, length?: number): ShutdownRequest {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseShutdownRequest } as ShutdownRequest;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },
  fromJSON(_: any): ShutdownRequest {
    const message = { ...baseShutdownRequest } as ShutdownRequest;
    return message;
  },
  fromPartial(_: DeepPartial<ShutdownRequest>): ShutdownRequest {
    const message = { ...baseShutdownRequest } as ShutdownRequest;
    return message;
  },
  toJSON(_: ShutdownRequest): unknown {
    const obj: any = {};
    return obj;
  },
};

export const ShutdownResponse = {
  encode(message: ShutdownResponse, writer: Writer = Writer.create()): Writer {
    writer.uint32(8).int32(message.timestamp);
    return writer;
  },
  decode(input: Uint8Array | Reader, length?: number): ShutdownResponse {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseShutdownResponse } as ShutdownResponse;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.timestamp = reader.int32();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },
  fromJSON(object: any): ShutdownResponse {
    const message = { ...baseShutdownResponse } as ShutdownResponse;
    if (object.timestamp !== undefined && object.timestamp !== null) {
      message.timestamp = Number(object.timestamp);
    } else {
      message.timestamp = 0;
    }
    return message;
  },
  fromPartial(object: DeepPartial<ShutdownResponse>): ShutdownResponse {
    const message = { ...baseShutdownResponse } as ShutdownResponse;
    if (object.timestamp !== undefined && object.timestamp !== null) {
      message.timestamp = object.timestamp;
    } else {
      message.timestamp = 0;
    }
    return message;
  },
  toJSON(message: ShutdownResponse): unknown {
    const obj: any = {};
    obj.timestamp = message.timestamp || 0;
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