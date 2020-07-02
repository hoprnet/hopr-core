/* eslint-disable */
import { Reader, Writer } from 'protobufjs/minimal';


export interface VersionRequest {
}

export interface VersionResponse {
  version: string;
  componentsVersion: { [key: string]: string };
}

export interface VersionResponse_ComponentsVersionEntry {
  key: string;
  value: string;
}

const baseVersionRequest: object = {
};

const baseVersionResponse: object = {
  version: "",
};

const baseVersionResponse_ComponentsVersionEntry: object = {
  key: "",
  value: "",
};

export interface Version {

  GetVersion(request: VersionRequest): Promise<VersionResponse>;

}

export class VersionClientImpl implements Version {

  private readonly rpc: Rpc;

  constructor(rpc: Rpc) {
    this.rpc = rpc;
  }

  GetVersion(request: VersionRequest): Promise<VersionResponse> {
    const data = VersionRequest.encode(request).finish();
    const promise = this.rpc.request("version.Version", "GetVersion", data);
    return promise.then(data => VersionResponse.decode(new Reader(data)));
  }

}

interface Rpc {

  request(service: string, method: string, data: Uint8Array): Promise<Uint8Array>;

}

export const VersionRequest = {
  encode(_: VersionRequest, writer: Writer = Writer.create()): Writer {
    return writer;
  },
  decode(input: Uint8Array | Reader, length?: number): VersionRequest {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseVersionRequest } as VersionRequest;
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
  fromJSON(_: any): VersionRequest {
    const message = { ...baseVersionRequest } as VersionRequest;
    return message;
  },
  fromPartial(_: DeepPartial<VersionRequest>): VersionRequest {
    const message = { ...baseVersionRequest } as VersionRequest;
    return message;
  },
  toJSON(_: VersionRequest): unknown {
    const obj: any = {};
    return obj;
  },
};

export const VersionResponse = {
  encode(message: VersionResponse, writer: Writer = Writer.create()): Writer {
    writer.uint32(10).string(message.version);
    Object.entries(message.componentsVersion).forEach(([key, value]) => {
      VersionResponse_ComponentsVersionEntry.encode({ key: key as any, value }, writer.uint32(18).fork()).ldelim();
    })
    return writer;
  },
  decode(input: Uint8Array | Reader, length?: number): VersionResponse {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseVersionResponse } as VersionResponse;
    message.componentsVersion = {};
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.version = reader.string();
          break;
        case 2:
          const entry2 = VersionResponse_ComponentsVersionEntry.decode(reader, reader.uint32());
          if (entry2.value !== undefined) {
            message.componentsVersion[entry2.key] = entry2.value;
          }
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },
  fromJSON(object: any): VersionResponse {
    const message = { ...baseVersionResponse } as VersionResponse;
    message.componentsVersion = {};
    if (object.version !== undefined && object.version !== null) {
      message.version = String(object.version);
    } else {
      message.version = "";
    }
    if (object.componentsVersion !== undefined && object.componentsVersion !== null) {
      Object.entries(object.componentsVersion).forEach(([key, value]) => {
        message.componentsVersion[key] = String(value);
      })
    }
    return message;
  },
  fromPartial(object: DeepPartial<VersionResponse>): VersionResponse {
    const message = { ...baseVersionResponse } as VersionResponse;
    message.componentsVersion = {};
    if (object.version !== undefined && object.version !== null) {
      message.version = object.version;
    } else {
      message.version = "";
    }
    if (object.componentsVersion !== undefined && object.componentsVersion !== null) {
      Object.entries(object.componentsVersion).forEach(([key, value]) => {
        if (value !== undefined) {
          message.componentsVersion[key] = String(value);
        }
      })
    }
    return message;
  },
  toJSON(message: VersionResponse): unknown {
    const obj: any = {};
    obj.version = message.version || "";
    obj.componentsVersion = message.componentsVersion || undefined;
    return obj;
  },
};

export const VersionResponse_ComponentsVersionEntry = {
  encode(message: VersionResponse_ComponentsVersionEntry, writer: Writer = Writer.create()): Writer {
    writer.uint32(10).string(message.key);
    writer.uint32(18).string(message.value);
    return writer;
  },
  decode(input: Uint8Array | Reader, length?: number): VersionResponse_ComponentsVersionEntry {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseVersionResponse_ComponentsVersionEntry } as VersionResponse_ComponentsVersionEntry;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.key = reader.string();
          break;
        case 2:
          message.value = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },
  fromJSON(object: any): VersionResponse_ComponentsVersionEntry {
    const message = { ...baseVersionResponse_ComponentsVersionEntry } as VersionResponse_ComponentsVersionEntry;
    if (object.key !== undefined && object.key !== null) {
      message.key = String(object.key);
    } else {
      message.key = "";
    }
    if (object.value !== undefined && object.value !== null) {
      message.value = String(object.value);
    } else {
      message.value = "";
    }
    return message;
  },
  fromPartial(object: DeepPartial<VersionResponse_ComponentsVersionEntry>): VersionResponse_ComponentsVersionEntry {
    const message = { ...baseVersionResponse_ComponentsVersionEntry } as VersionResponse_ComponentsVersionEntry;
    if (object.key !== undefined && object.key !== null) {
      message.key = object.key;
    } else {
      message.key = "";
    }
    if (object.value !== undefined && object.value !== null) {
      message.value = object.value;
    } else {
      message.value = "";
    }
    return message;
  },
  toJSON(message: VersionResponse_ComponentsVersionEntry): unknown {
    const obj: any = {};
    obj.key = message.key || "";
    obj.value = message.value || "";
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