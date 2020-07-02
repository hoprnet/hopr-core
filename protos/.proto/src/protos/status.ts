/* eslint-disable */
import { Reader, Writer } from 'protobufjs/minimal';


export interface StatusRequest {
}

export interface StatusResponse {
  ip: string;
  load: number;
  cpuUsage: number;
  /**
   *  number of connected notes
   */
  connectedNotes: number;
}

const baseStatusRequest: object = {
};

const baseStatusResponse: object = {
  ip: "",
  load: 0,
  cpuUsage: 0,
  connectedNotes: 0,
};

export interface Status {

  GetStatus(request: StatusRequest): Promise<StatusResponse>;

}

export class StatusClientImpl implements Status {

  private readonly rpc: Rpc;

  constructor(rpc: Rpc) {
    this.rpc = rpc;
  }

  GetStatus(request: StatusRequest): Promise<StatusResponse> {
    const data = StatusRequest.encode(request).finish();
    const promise = this.rpc.request("status.Status", "GetStatus", data);
    return promise.then(data => StatusResponse.decode(new Reader(data)));
  }

}

interface Rpc {

  request(service: string, method: string, data: Uint8Array): Promise<Uint8Array>;

}

export const StatusRequest = {
  encode(_: StatusRequest, writer: Writer = Writer.create()): Writer {
    return writer;
  },
  decode(input: Uint8Array | Reader, length?: number): StatusRequest {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseStatusRequest } as StatusRequest;
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
  fromJSON(_: any): StatusRequest {
    const message = { ...baseStatusRequest } as StatusRequest;
    return message;
  },
  fromPartial(_: DeepPartial<StatusRequest>): StatusRequest {
    const message = { ...baseStatusRequest } as StatusRequest;
    return message;
  },
  toJSON(_: StatusRequest): unknown {
    const obj: any = {};
    return obj;
  },
};

export const StatusResponse = {
  encode(message: StatusResponse, writer: Writer = Writer.create()): Writer {
    writer.uint32(10).string(message.ip);
    writer.uint32(21).float(message.load);
    writer.uint32(29).float(message.cpuUsage);
    writer.uint32(32).int32(message.connectedNotes);
    return writer;
  },
  decode(input: Uint8Array | Reader, length?: number): StatusResponse {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseStatusResponse } as StatusResponse;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.ip = reader.string();
          break;
        case 2:
          message.load = reader.float();
          break;
        case 3:
          message.cpuUsage = reader.float();
          break;
        case 4:
          message.connectedNotes = reader.int32();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },
  fromJSON(object: any): StatusResponse {
    const message = { ...baseStatusResponse } as StatusResponse;
    if (object.ip !== undefined && object.ip !== null) {
      message.ip = String(object.ip);
    } else {
      message.ip = "";
    }
    if (object.load !== undefined && object.load !== null) {
      message.load = Number(object.load);
    } else {
      message.load = 0;
    }
    if (object.cpuUsage !== undefined && object.cpuUsage !== null) {
      message.cpuUsage = Number(object.cpuUsage);
    } else {
      message.cpuUsage = 0;
    }
    if (object.connectedNotes !== undefined && object.connectedNotes !== null) {
      message.connectedNotes = Number(object.connectedNotes);
    } else {
      message.connectedNotes = 0;
    }
    return message;
  },
  fromPartial(object: DeepPartial<StatusResponse>): StatusResponse {
    const message = { ...baseStatusResponse } as StatusResponse;
    if (object.ip !== undefined && object.ip !== null) {
      message.ip = object.ip;
    } else {
      message.ip = "";
    }
    if (object.load !== undefined && object.load !== null) {
      message.load = object.load;
    } else {
      message.load = 0;
    }
    if (object.cpuUsage !== undefined && object.cpuUsage !== null) {
      message.cpuUsage = object.cpuUsage;
    } else {
      message.cpuUsage = 0;
    }
    if (object.connectedNotes !== undefined && object.connectedNotes !== null) {
      message.connectedNotes = object.connectedNotes;
    } else {
      message.connectedNotes = 0;
    }
    return message;
  },
  toJSON(message: StatusResponse): unknown {
    const obj: any = {};
    obj.ip = message.ip || "";
    obj.load = message.load || 0;
    obj.cpuUsage = message.cpuUsage || 0;
    obj.connectedNotes = message.connectedNotes || 0;
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