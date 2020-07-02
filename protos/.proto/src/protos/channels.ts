/* eslint-disable */
import { Reader, Writer } from 'protobufjs/minimal';


export interface GetChannelsRequest {
}

export interface GetChannelsResponse {
  channels: string[];
}

export interface GetChannelInfoRequest {
  channelId: string;
}

export interface GetChannelInfoResponse {
  state: GetChannelInfoResponse_State;
  balance: string;
}

export interface OpenChannelRequest {
  peerId: string;
}

export interface OpenChannelResponse {
  channelId: string;
}

export interface CloseChannelRequest {
  channelId: string;
}

export interface CloseChannelResponse {
  channelId: string;
}

const baseGetChannelsRequest: object = {
};

const baseGetChannelsResponse: object = {
  channels: "",
};

const baseGetChannelInfoRequest: object = {
  channelId: "",
};

const baseGetChannelInfoResponse: object = {
  state: 0,
  balance: "",
};

const baseOpenChannelRequest: object = {
  peerId: "",
};

const baseOpenChannelResponse: object = {
  channelId: "",
};

const baseCloseChannelRequest: object = {
  channelId: "",
};

const baseCloseChannelResponse: object = {
  channelId: "",
};

export interface Channels {

  GetChannels(request: GetChannelsRequest): Promise<GetChannelsResponse>;

  GetChannelInfo(request: GetChannelInfoRequest): Promise<GetChannelInfoResponse>;

  OpenChannel(request: OpenChannelRequest): Promise<OpenChannelResponse>;

  CloseChannel(request: CloseChannelRequest): Promise<CloseChannelResponse>;

}

export class ChannelsClientImpl implements Channels {

  private readonly rpc: Rpc;

  constructor(rpc: Rpc) {
    this.rpc = rpc;
  }

  GetChannels(request: GetChannelsRequest): Promise<GetChannelsResponse> {
    const data = GetChannelsRequest.encode(request).finish();
    const promise = this.rpc.request("channels.Channels", "GetChannels", data);
    return promise.then(data => GetChannelsResponse.decode(new Reader(data)));
  }

  GetChannelInfo(request: GetChannelInfoRequest): Promise<GetChannelInfoResponse> {
    const data = GetChannelInfoRequest.encode(request).finish();
    const promise = this.rpc.request("channels.Channels", "GetChannelInfo", data);
    return promise.then(data => GetChannelInfoResponse.decode(new Reader(data)));
  }

  OpenChannel(request: OpenChannelRequest): Promise<OpenChannelResponse> {
    const data = OpenChannelRequest.encode(request).finish();
    const promise = this.rpc.request("channels.Channels", "OpenChannel", data);
    return promise.then(data => OpenChannelResponse.decode(new Reader(data)));
  }

  CloseChannel(request: CloseChannelRequest): Promise<CloseChannelResponse> {
    const data = CloseChannelRequest.encode(request).finish();
    const promise = this.rpc.request("channels.Channels", "CloseChannel", data);
    return promise.then(data => CloseChannelResponse.decode(new Reader(data)));
  }

}

interface Rpc {

  request(service: string, method: string, data: Uint8Array): Promise<Uint8Array>;

}

export const GetChannelInfoResponse_State = {
  UNKNOWN: 0 as const,
  UNINITIALISED: 1 as const,
  FUNDED: 2 as const,
  OPEN: 3 as const,
  PENDING: 4 as const,
  UNRECOGNIZED: -1 as const,
  fromJSON(object: any): GetChannelInfoResponse_State {
    switch (object) {
      case 0:
      case "UNKNOWN":
        return GetChannelInfoResponse_State.UNKNOWN;
      case 1:
      case "UNINITIALISED":
        return GetChannelInfoResponse_State.UNINITIALISED;
      case 2:
      case "FUNDED":
        return GetChannelInfoResponse_State.FUNDED;
      case 3:
      case "OPEN":
        return GetChannelInfoResponse_State.OPEN;
      case 4:
      case "PENDING":
        return GetChannelInfoResponse_State.PENDING;
      case -1:
      case "UNRECOGNIZED":
      default:
        return GetChannelInfoResponse_State.UNRECOGNIZED;
    }
  },
  toJSON(object: GetChannelInfoResponse_State): string {
    switch (object) {
      case GetChannelInfoResponse_State.UNKNOWN:
        return "UNKNOWN";
      case GetChannelInfoResponse_State.UNINITIALISED:
        return "UNINITIALISED";
      case GetChannelInfoResponse_State.FUNDED:
        return "FUNDED";
      case GetChannelInfoResponse_State.OPEN:
        return "OPEN";
      case GetChannelInfoResponse_State.PENDING:
        return "PENDING";
      default:
        return "UNKNOWN";
    }
  },
}

export type GetChannelInfoResponse_State = 0 | 1 | 2 | 3 | 4 | -1;

export const GetChannelsRequest = {
  encode(_: GetChannelsRequest, writer: Writer = Writer.create()): Writer {
    return writer;
  },
  decode(input: Uint8Array | Reader, length?: number): GetChannelsRequest {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseGetChannelsRequest } as GetChannelsRequest;
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
  fromJSON(_: any): GetChannelsRequest {
    const message = { ...baseGetChannelsRequest } as GetChannelsRequest;
    return message;
  },
  fromPartial(_: DeepPartial<GetChannelsRequest>): GetChannelsRequest {
    const message = { ...baseGetChannelsRequest } as GetChannelsRequest;
    return message;
  },
  toJSON(_: GetChannelsRequest): unknown {
    const obj: any = {};
    return obj;
  },
};

export const GetChannelsResponse = {
  encode(message: GetChannelsResponse, writer: Writer = Writer.create()): Writer {
    for (const v of message.channels) {
      writer.uint32(10).string(v!);
    }
    return writer;
  },
  decode(input: Uint8Array | Reader, length?: number): GetChannelsResponse {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseGetChannelsResponse } as GetChannelsResponse;
    message.channels = [];
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.channels.push(reader.string());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },
  fromJSON(object: any): GetChannelsResponse {
    const message = { ...baseGetChannelsResponse } as GetChannelsResponse;
    message.channels = [];
    if (object.channels !== undefined && object.channels !== null) {
      for (const e of object.channels) {
        message.channels.push(String(e));
      }
    }
    return message;
  },
  fromPartial(object: DeepPartial<GetChannelsResponse>): GetChannelsResponse {
    const message = { ...baseGetChannelsResponse } as GetChannelsResponse;
    message.channels = [];
    if (object.channels !== undefined && object.channels !== null) {
      for (const e of object.channels) {
        message.channels.push(e);
      }
    }
    return message;
  },
  toJSON(message: GetChannelsResponse): unknown {
    const obj: any = {};
    if (message.channels) {
      obj.channels = message.channels.map(e => e || "");
    } else {
      obj.channels = [];
    }
    return obj;
  },
};

export const GetChannelInfoRequest = {
  encode(message: GetChannelInfoRequest, writer: Writer = Writer.create()): Writer {
    writer.uint32(10).string(message.channelId);
    return writer;
  },
  decode(input: Uint8Array | Reader, length?: number): GetChannelInfoRequest {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseGetChannelInfoRequest } as GetChannelInfoRequest;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.channelId = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },
  fromJSON(object: any): GetChannelInfoRequest {
    const message = { ...baseGetChannelInfoRequest } as GetChannelInfoRequest;
    if (object.channelId !== undefined && object.channelId !== null) {
      message.channelId = String(object.channelId);
    } else {
      message.channelId = "";
    }
    return message;
  },
  fromPartial(object: DeepPartial<GetChannelInfoRequest>): GetChannelInfoRequest {
    const message = { ...baseGetChannelInfoRequest } as GetChannelInfoRequest;
    if (object.channelId !== undefined && object.channelId !== null) {
      message.channelId = object.channelId;
    } else {
      message.channelId = "";
    }
    return message;
  },
  toJSON(message: GetChannelInfoRequest): unknown {
    const obj: any = {};
    obj.channelId = message.channelId || "";
    return obj;
  },
};

export const GetChannelInfoResponse = {
  encode(message: GetChannelInfoResponse, writer: Writer = Writer.create()): Writer {
    writer.uint32(8).int32(message.state);
    writer.uint32(18).string(message.balance);
    return writer;
  },
  decode(input: Uint8Array | Reader, length?: number): GetChannelInfoResponse {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseGetChannelInfoResponse } as GetChannelInfoResponse;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.state = reader.int32() as any;
          break;
        case 2:
          message.balance = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },
  fromJSON(object: any): GetChannelInfoResponse {
    const message = { ...baseGetChannelInfoResponse } as GetChannelInfoResponse;
    if (object.state !== undefined && object.state !== null) {
      message.state = GetChannelInfoResponse_State.fromJSON(object.state);
    } else {
      message.state = 0;
    }
    if (object.balance !== undefined && object.balance !== null) {
      message.balance = String(object.balance);
    } else {
      message.balance = "";
    }
    return message;
  },
  fromPartial(object: DeepPartial<GetChannelInfoResponse>): GetChannelInfoResponse {
    const message = { ...baseGetChannelInfoResponse } as GetChannelInfoResponse;
    if (object.state !== undefined && object.state !== null) {
      message.state = object.state;
    } else {
      message.state = 0;
    }
    if (object.balance !== undefined && object.balance !== null) {
      message.balance = object.balance;
    } else {
      message.balance = "";
    }
    return message;
  },
  toJSON(message: GetChannelInfoResponse): unknown {
    const obj: any = {};
    obj.state = GetChannelInfoResponse_State.toJSON(message.state);
    obj.balance = message.balance || "";
    return obj;
  },
};

export const OpenChannelRequest = {
  encode(message: OpenChannelRequest, writer: Writer = Writer.create()): Writer {
    writer.uint32(10).string(message.peerId);
    return writer;
  },
  decode(input: Uint8Array | Reader, length?: number): OpenChannelRequest {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseOpenChannelRequest } as OpenChannelRequest;
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
  fromJSON(object: any): OpenChannelRequest {
    const message = { ...baseOpenChannelRequest } as OpenChannelRequest;
    if (object.peerId !== undefined && object.peerId !== null) {
      message.peerId = String(object.peerId);
    } else {
      message.peerId = "";
    }
    return message;
  },
  fromPartial(object: DeepPartial<OpenChannelRequest>): OpenChannelRequest {
    const message = { ...baseOpenChannelRequest } as OpenChannelRequest;
    if (object.peerId !== undefined && object.peerId !== null) {
      message.peerId = object.peerId;
    } else {
      message.peerId = "";
    }
    return message;
  },
  toJSON(message: OpenChannelRequest): unknown {
    const obj: any = {};
    obj.peerId = message.peerId || "";
    return obj;
  },
};

export const OpenChannelResponse = {
  encode(message: OpenChannelResponse, writer: Writer = Writer.create()): Writer {
    writer.uint32(10).string(message.channelId);
    return writer;
  },
  decode(input: Uint8Array | Reader, length?: number): OpenChannelResponse {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseOpenChannelResponse } as OpenChannelResponse;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.channelId = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },
  fromJSON(object: any): OpenChannelResponse {
    const message = { ...baseOpenChannelResponse } as OpenChannelResponse;
    if (object.channelId !== undefined && object.channelId !== null) {
      message.channelId = String(object.channelId);
    } else {
      message.channelId = "";
    }
    return message;
  },
  fromPartial(object: DeepPartial<OpenChannelResponse>): OpenChannelResponse {
    const message = { ...baseOpenChannelResponse } as OpenChannelResponse;
    if (object.channelId !== undefined && object.channelId !== null) {
      message.channelId = object.channelId;
    } else {
      message.channelId = "";
    }
    return message;
  },
  toJSON(message: OpenChannelResponse): unknown {
    const obj: any = {};
    obj.channelId = message.channelId || "";
    return obj;
  },
};

export const CloseChannelRequest = {
  encode(message: CloseChannelRequest, writer: Writer = Writer.create()): Writer {
    writer.uint32(10).string(message.channelId);
    return writer;
  },
  decode(input: Uint8Array | Reader, length?: number): CloseChannelRequest {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseCloseChannelRequest } as CloseChannelRequest;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.channelId = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },
  fromJSON(object: any): CloseChannelRequest {
    const message = { ...baseCloseChannelRequest } as CloseChannelRequest;
    if (object.channelId !== undefined && object.channelId !== null) {
      message.channelId = String(object.channelId);
    } else {
      message.channelId = "";
    }
    return message;
  },
  fromPartial(object: DeepPartial<CloseChannelRequest>): CloseChannelRequest {
    const message = { ...baseCloseChannelRequest } as CloseChannelRequest;
    if (object.channelId !== undefined && object.channelId !== null) {
      message.channelId = object.channelId;
    } else {
      message.channelId = "";
    }
    return message;
  },
  toJSON(message: CloseChannelRequest): unknown {
    const obj: any = {};
    obj.channelId = message.channelId || "";
    return obj;
  },
};

export const CloseChannelResponse = {
  encode(message: CloseChannelResponse, writer: Writer = Writer.create()): Writer {
    writer.uint32(10).string(message.channelId);
    return writer;
  },
  decode(input: Uint8Array | Reader, length?: number): CloseChannelResponse {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseCloseChannelResponse } as CloseChannelResponse;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.channelId = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },
  fromJSON(object: any): CloseChannelResponse {
    const message = { ...baseCloseChannelResponse } as CloseChannelResponse;
    if (object.channelId !== undefined && object.channelId !== null) {
      message.channelId = String(object.channelId);
    } else {
      message.channelId = "";
    }
    return message;
  },
  fromPartial(object: DeepPartial<CloseChannelResponse>): CloseChannelResponse {
    const message = { ...baseCloseChannelResponse } as CloseChannelResponse;
    if (object.channelId !== undefined && object.channelId !== null) {
      message.channelId = object.channelId;
    } else {
      message.channelId = "";
    }
    return message;
  },
  toJSON(message: CloseChannelResponse): unknown {
    const obj: any = {};
    obj.channelId = message.channelId || "";
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