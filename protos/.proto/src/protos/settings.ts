/* eslint-disable */
import { Reader, Writer } from 'protobufjs/minimal';


export interface UpdateSettingsRequest {
  isUsingCoverTraffic: boolean;
  bootstrapServers: string[];
}

export interface UpdateSettingsResponse {
  latency: number;
}

const baseUpdateSettingsRequest: object = {
  isUsingCoverTraffic: false,
  bootstrapServers: "",
};

const baseUpdateSettingsResponse: object = {
  latency: 0,
};

export interface Settings {

  /**
   *  update setting on the fly without requiring a restart
   */
  UpdateSettings(request: UpdateSettingsRequest): Promise<UpdateSettingsResponse>;

}

export class SettingsClientImpl implements Settings {

  private readonly rpc: Rpc;

  constructor(rpc: Rpc) {
    this.rpc = rpc;
  }

  UpdateSettings(request: UpdateSettingsRequest): Promise<UpdateSettingsResponse> {
    const data = UpdateSettingsRequest.encode(request).finish();
    const promise = this.rpc.request("ping.Settings", "UpdateSettings", data);
    return promise.then(data => UpdateSettingsResponse.decode(new Reader(data)));
  }

}

interface Rpc {

  request(service: string, method: string, data: Uint8Array): Promise<Uint8Array>;

}

export const UpdateSettingsRequest = {
  encode(message: UpdateSettingsRequest, writer: Writer = Writer.create()): Writer {
    writer.uint32(8).bool(message.isUsingCoverTraffic);
    for (const v of message.bootstrapServers) {
      writer.uint32(18).string(v!);
    }
    return writer;
  },
  decode(input: Uint8Array | Reader, length?: number): UpdateSettingsRequest {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseUpdateSettingsRequest } as UpdateSettingsRequest;
    message.bootstrapServers = [];
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.isUsingCoverTraffic = reader.bool();
          break;
        case 2:
          message.bootstrapServers.push(reader.string());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },
  fromJSON(object: any): UpdateSettingsRequest {
    const message = { ...baseUpdateSettingsRequest } as UpdateSettingsRequest;
    message.bootstrapServers = [];
    if (object.isUsingCoverTraffic !== undefined && object.isUsingCoverTraffic !== null) {
      message.isUsingCoverTraffic = Boolean(object.isUsingCoverTraffic);
    } else {
      message.isUsingCoverTraffic = false;
    }
    if (object.bootstrapServers !== undefined && object.bootstrapServers !== null) {
      for (const e of object.bootstrapServers) {
        message.bootstrapServers.push(String(e));
      }
    }
    return message;
  },
  fromPartial(object: DeepPartial<UpdateSettingsRequest>): UpdateSettingsRequest {
    const message = { ...baseUpdateSettingsRequest } as UpdateSettingsRequest;
    message.bootstrapServers = [];
    if (object.isUsingCoverTraffic !== undefined && object.isUsingCoverTraffic !== null) {
      message.isUsingCoverTraffic = object.isUsingCoverTraffic;
    } else {
      message.isUsingCoverTraffic = false;
    }
    if (object.bootstrapServers !== undefined && object.bootstrapServers !== null) {
      for (const e of object.bootstrapServers) {
        message.bootstrapServers.push(e);
      }
    }
    return message;
  },
  toJSON(message: UpdateSettingsRequest): unknown {
    const obj: any = {};
    obj.isUsingCoverTraffic = message.isUsingCoverTraffic || false;
    if (message.bootstrapServers) {
      obj.bootstrapServers = message.bootstrapServers.map(e => e || "");
    } else {
      obj.bootstrapServers = [];
    }
    return obj;
  },
};

export const UpdateSettingsResponse = {
  encode(message: UpdateSettingsResponse, writer: Writer = Writer.create()): Writer {
    writer.uint32(8).int32(message.latency);
    return writer;
  },
  decode(input: Uint8Array | Reader, length?: number): UpdateSettingsResponse {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseUpdateSettingsResponse } as UpdateSettingsResponse;
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
  fromJSON(object: any): UpdateSettingsResponse {
    const message = { ...baseUpdateSettingsResponse } as UpdateSettingsResponse;
    if (object.latency !== undefined && object.latency !== null) {
      message.latency = Number(object.latency);
    } else {
      message.latency = 0;
    }
    return message;
  },
  fromPartial(object: DeepPartial<UpdateSettingsResponse>): UpdateSettingsResponse {
    const message = { ...baseUpdateSettingsResponse } as UpdateSettingsResponse;
    if (object.latency !== undefined && object.latency !== null) {
      message.latency = object.latency;
    } else {
      message.latency = 0;
    }
    return message;
  },
  toJSON(message: UpdateSettingsResponse): unknown {
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