/* eslint-disable */
import { Reader, Writer } from 'protobufjs/minimal';


export interface GetNativeAddressRequest {
}

export interface GetNativeAddressResponse {
  address: string;
}

export interface GetHoprAddressRequest {
}

export interface GetHoprAddressResponse {
  address: string;
}

const baseGetNativeAddressRequest: object = {
};

const baseGetNativeAddressResponse: object = {
  address: "",
};

const baseGetHoprAddressRequest: object = {
};

const baseGetHoprAddressResponse: object = {
  address: "",
};

export interface Address {

  /**
   *  ex: ethereum address
   */
  GetNativeAddress(request: GetNativeAddressRequest): Promise<GetNativeAddressResponse>;

  GetHoprAddress(request: GetHoprAddressRequest): Promise<GetHoprAddressResponse>;

}

export class AddressClientImpl implements Address {

  private readonly rpc: Rpc;

  constructor(rpc: Rpc) {
    this.rpc = rpc;
  }

  GetNativeAddress(request: GetNativeAddressRequest): Promise<GetNativeAddressResponse> {
    const data = GetNativeAddressRequest.encode(request).finish();
    const promise = this.rpc.request("address.Address", "GetNativeAddress", data);
    return promise.then(data => GetNativeAddressResponse.decode(new Reader(data)));
  }

  GetHoprAddress(request: GetHoprAddressRequest): Promise<GetHoprAddressResponse> {
    const data = GetHoprAddressRequest.encode(request).finish();
    const promise = this.rpc.request("address.Address", "GetHoprAddress", data);
    return promise.then(data => GetHoprAddressResponse.decode(new Reader(data)));
  }

}

interface Rpc {

  request(service: string, method: string, data: Uint8Array): Promise<Uint8Array>;

}

export const GetNativeAddressRequest = {
  encode(_: GetNativeAddressRequest, writer: Writer = Writer.create()): Writer {
    return writer;
  },
  decode(input: Uint8Array | Reader, length?: number): GetNativeAddressRequest {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseGetNativeAddressRequest } as GetNativeAddressRequest;
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
  fromJSON(_: any): GetNativeAddressRequest {
    const message = { ...baseGetNativeAddressRequest } as GetNativeAddressRequest;
    return message;
  },
  fromPartial(_: DeepPartial<GetNativeAddressRequest>): GetNativeAddressRequest {
    const message = { ...baseGetNativeAddressRequest } as GetNativeAddressRequest;
    return message;
  },
  toJSON(_: GetNativeAddressRequest): unknown {
    const obj: any = {};
    return obj;
  },
};

export const GetNativeAddressResponse = {
  encode(message: GetNativeAddressResponse, writer: Writer = Writer.create()): Writer {
    writer.uint32(10).string(message.address);
    return writer;
  },
  decode(input: Uint8Array | Reader, length?: number): GetNativeAddressResponse {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseGetNativeAddressResponse } as GetNativeAddressResponse;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.address = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },
  fromJSON(object: any): GetNativeAddressResponse {
    const message = { ...baseGetNativeAddressResponse } as GetNativeAddressResponse;
    if (object.address !== undefined && object.address !== null) {
      message.address = String(object.address);
    } else {
      message.address = "";
    }
    return message;
  },
  fromPartial(object: DeepPartial<GetNativeAddressResponse>): GetNativeAddressResponse {
    const message = { ...baseGetNativeAddressResponse } as GetNativeAddressResponse;
    if (object.address !== undefined && object.address !== null) {
      message.address = object.address;
    } else {
      message.address = "";
    }
    return message;
  },
  toJSON(message: GetNativeAddressResponse): unknown {
    const obj: any = {};
    obj.address = message.address || "";
    return obj;
  },
};

export const GetHoprAddressRequest = {
  encode(_: GetHoprAddressRequest, writer: Writer = Writer.create()): Writer {
    return writer;
  },
  decode(input: Uint8Array | Reader, length?: number): GetHoprAddressRequest {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseGetHoprAddressRequest } as GetHoprAddressRequest;
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
  fromJSON(_: any): GetHoprAddressRequest {
    const message = { ...baseGetHoprAddressRequest } as GetHoprAddressRequest;
    return message;
  },
  fromPartial(_: DeepPartial<GetHoprAddressRequest>): GetHoprAddressRequest {
    const message = { ...baseGetHoprAddressRequest } as GetHoprAddressRequest;
    return message;
  },
  toJSON(_: GetHoprAddressRequest): unknown {
    const obj: any = {};
    return obj;
  },
};

export const GetHoprAddressResponse = {
  encode(message: GetHoprAddressResponse, writer: Writer = Writer.create()): Writer {
    writer.uint32(10).string(message.address);
    return writer;
  },
  decode(input: Uint8Array | Reader, length?: number): GetHoprAddressResponse {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseGetHoprAddressResponse } as GetHoprAddressResponse;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.address = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },
  fromJSON(object: any): GetHoprAddressResponse {
    const message = { ...baseGetHoprAddressResponse } as GetHoprAddressResponse;
    if (object.address !== undefined && object.address !== null) {
      message.address = String(object.address);
    } else {
      message.address = "";
    }
    return message;
  },
  fromPartial(object: DeepPartial<GetHoprAddressResponse>): GetHoprAddressResponse {
    const message = { ...baseGetHoprAddressResponse } as GetHoprAddressResponse;
    if (object.address !== undefined && object.address !== null) {
      message.address = object.address;
    } else {
      message.address = "";
    }
    return message;
  },
  toJSON(message: GetHoprAddressResponse): unknown {
    const obj: any = {};
    obj.address = message.address || "";
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