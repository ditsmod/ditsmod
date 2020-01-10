import { Injectable, Inject } from 'ts-di';

import { NodeRequest, NodeResponse, NodeReqToken, NodeResToken, RedirectStatusCodes } from './types';
import { Request } from './request';
import { Status, getStatusText, isSuccess } from './http-status-codes';

@Injectable()
export class Response {
  constructor(
    @Inject(NodeReqToken) public readonly nodeReq: NodeRequest,
    @Inject(NodeResToken) public readonly nodeRes: NodeResponse,
    protected req: Request
  ) {}

  send(statusCode: Status, data?: string | Buffer | Uint8Array): void;
  send(data: string | Buffer | Uint8Array): void;
  send(dataOrStatusCode: string | Buffer | Uint8Array | number, data?: string | Buffer | Uint8Array): void {
    let statusCode = Status.OK;

    if (typeof dataOrStatusCode == 'number') {
      this.nodeRes.statusCode = statusCode = dataOrStatusCode;
    } else {
      data = dataOrStatusCode;
    }

    if (!isSuccess(statusCode)) {
      data = data || getStatusText(statusCode);
    }

    this.nodeRes.end(data);
  }

  redirect(statusCode: RedirectStatusCodes, path: string) {
    this.nodeRes.writeHead(statusCode, { Location: path });
    this.nodeRes.end();
  }

  protected sendError(statusCode: Status, message?: string): void {
    this.nodeRes.statusCode = statusCode;
    this.nodeRes.setHeader('Content-Type', 'application/json; charset=utf-8');
    const str = JSON.stringify({ error: message });
    this.nodeRes.setHeader('Content-Length', Buffer.byteLength(str).toString());
    this.nodeRes.end(str);
  }
}
