/* eslint-disable */
import { Reader, Writer } from 'protobufjs/minimal';


export interface GetNativeBalanceRequest {
}

export interface GetNativeBalanceResponse {
  amount: string;
}

export interface GetHoprBalanceRequest {
}

export interface GetHoprBalanceResponse {
  amount: string;
}

const baseGetNativeBalanceRequest: object = {
};

const baseGetNativeBalanceResponse: object = {
  amount: "",
};

const baseGetHoprBalanceRequest: object = {
};

const baseGetHoprBalanceResponse: object = {
  amount: "",
};

export interface Balance {

  /**
   *  ex: ether
   */
  GetNativeBalance(request: GetNativeBalanceRequest): Promise<GetNativeBalanceResponse>;

  GetHoprBalance(request: GetHoprBalanceRequest): Promise<GetHoprBalanceResponse>;

}

export class BalanceClientImpl implements Balance {

  private readonly rpc: Rpc;

  constructor(rpc: Rpc) {
    this.rpc = rpc;
  }

  GetNativeBalance(request: GetNativeBalanceRequest): Promise<GetNativeBalanceResponse> {
    const data = GetNativeBalanceRequest.encode(request).finish();
    const promise = this.rpc.request("balance.Balance", "GetNativeBalance", data);
    return promise.then(data => GetNativeBalanceResponse.decode(new Reader(data)));
  }

  GetHoprBalance(request: GetHoprBalanceRequest): Promise<GetHoprBalanceResponse> {
    const data = GetHoprBalanceRequest.encode(request).finish();
    const promise = this.rpc.request("balance.Balance", "GetHoprBalance", data);
    return promise.then(data => GetHoprBalanceResponse.decode(new Reader(data)));
  }

}

interface Rpc {

  request(service: string, method: string, data: Uint8Array): Promise<Uint8Array>;

}

export const GetNativeBalanceRequest = {
  encode(_: GetNativeBalanceRequest, writer: Writer = Writer.create()): Writer {
    return writer;
  },
  decode(input: Uint8Array | Reader, length?: number): GetNativeBalanceRequest {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseGetNativeBalanceRequest } as GetNativeBalanceRequest;
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
  fromJSON(_: any): GetNativeBalanceRequest {
    const message = { ...baseGetNativeBalanceRequest } as GetNativeBalanceRequest;
    return message;
  },
  fromPartial(_: DeepPartial<GetNativeBalanceRequest>): GetNativeBalanceRequest {
    const message = { ...baseGetNativeBalanceRequest } as GetNativeBalanceRequest;
    return message;
  },
  toJSON(_: GetNativeBalanceRequest): unknown {
    const obj: any = {};
    return obj;
  },
};

export const GetNativeBalanceResponse = {
  encode(message: GetNativeBalanceResponse, writer: Writer = Writer.create()): Writer {
    writer.uint32(10).string(message.amount);
    return writer;
  },
  decode(input: Uint8Array | Reader, length?: number): GetNativeBalanceResponse {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseGetNativeBalanceResponse } as GetNativeBalanceResponse;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.amount = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },
  fromJSON(object: any): GetNativeBalanceResponse {
    const message = { ...baseGetNativeBalanceResponse } as GetNativeBalanceResponse;
    if (object.amount !== undefined && object.amount !== null) {
      message.amount = String(object.amount);
    } else {
      message.amount = "";
    }
    return message;
  },
  fromPartial(object: DeepPartial<GetNativeBalanceResponse>): GetNativeBalanceResponse {
    const message = { ...baseGetNativeBalanceResponse } as GetNativeBalanceResponse;
    if (object.amount !== undefined && object.amount !== null) {
      message.amount = object.amount;
    } else {
      message.amount = "";
    }
    return message;
  },
  toJSON(message: GetNativeBalanceResponse): unknown {
    const obj: any = {};
    obj.amount = message.amount || "";
    return obj;
  },
};

export const GetHoprBalanceRequest = {
  encode(_: GetHoprBalanceRequest, writer: Writer = Writer.create()): Writer {
    return writer;
  },
  decode(input: Uint8Array | Reader, length?: number): GetHoprBalanceRequest {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseGetHoprBalanceRequest } as GetHoprBalanceRequest;
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
  fromJSON(_: any): GetHoprBalanceRequest {
    const message = { ...baseGetHoprBalanceRequest } as GetHoprBalanceRequest;
    return message;
  },
  fromPartial(_: DeepPartial<GetHoprBalanceRequest>): GetHoprBalanceRequest {
    const message = { ...baseGetHoprBalanceRequest } as GetHoprBalanceRequest;
    return message;
  },
  toJSON(_: GetHoprBalanceRequest): unknown {
    const obj: any = {};
    return obj;
  },
};

export const GetHoprBalanceResponse = {
  encode(message: GetHoprBalanceResponse, writer: Writer = Writer.create()): Writer {
    writer.uint32(10).string(message.amount);
    return writer;
  },
  decode(input: Uint8Array | Reader, length?: number): GetHoprBalanceResponse {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseGetHoprBalanceResponse } as GetHoprBalanceResponse;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.amount = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },
  fromJSON(object: any): GetHoprBalanceResponse {
    const message = { ...baseGetHoprBalanceResponse } as GetHoprBalanceResponse;
    if (object.amount !== undefined && object.amount !== null) {
      message.amount = String(object.amount);
    } else {
      message.amount = "";
    }
    return message;
  },
  fromPartial(object: DeepPartial<GetHoprBalanceResponse>): GetHoprBalanceResponse {
    const message = { ...baseGetHoprBalanceResponse } as GetHoprBalanceResponse;
    if (object.amount !== undefined && object.amount !== null) {
      message.amount = object.amount;
    } else {
      message.amount = "";
    }
    return message;
  },
  toJSON(message: GetHoprBalanceResponse): unknown {
    const obj: any = {};
    obj.amount = message.amount || "";
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