import { format } from 'util';
import * as http from 'http';
import { Injectable, Inject } from 'ts-di';

import { NodeRequest, NodeResponse, RedirectStatusCodes } from './types/types';
import { Request } from './request';
import { Status } from './http-status-codes';
import { NodeReqToken, NodeResToken } from './types/injection-tokens';

@Injectable()
export class Response {
  constructor(
    @Inject(NodeReqToken) protected readonly nodeReq: NodeRequest,
    @Inject(NodeResToken) public readonly nodeRes: NodeResponse,
    protected req: Request
  ) {}

  /**
   * Setting value to the response header `Content-Type`.
   *
   * @example
   *
   * res.setContentType('application/xml').send({ one: 1, two: 2 });
   */
  setContentType(contentType: string) {
    this.nodeRes.setHeader('Content-Type', contentType);
    return this;
  }

  /**
   * Send data as is, without any transformation.
   */
  send(data?: string | Buffer | Uint8Array, statusCode: Status = Status.OK): void {
    this.nodeRes.statusCode = statusCode;
    this.nodeRes.end(data);
  }

  /**
   * To convert `any` type to `string` type, the `util.format()` function is used here.
   */
  sendText(data?: any, statusCode: Status = Status.OK): void {
    this.send(format(data), statusCode);
  }

  sendJson(data?: any, statusCode: Status = Status.OK): void {
    this.send(JSON.stringify(data), statusCode);
  }

  redirect(statusCode: RedirectStatusCodes, path: string) {
    this.nodeRes.writeHead(statusCode, { Location: path });
    this.nodeRes.end();
  }

  toString() {
    const headers = this.nodeReq.headers;
    let headerString = '';
    let str: string;

    Object.keys(headers).forEach(k => (headerString += k + ': ' + headers[k] + '\n'));

    str = format(
      'HTTP/%s %s %s\n%s',
      this.nodeReq.httpVersion,
      this.nodeRes.statusCode,
      http.STATUS_CODES[this.nodeRes.statusCode],
      headerString
    );

    return str;
  }
}
