import { format } from 'util';
import { Injectable, Inject } from '@ts-stack/di';

import { Status } from '../utils/http-status-codes';
import { RedirectStatusCodes } from '../types/mix';
import { NodeResponse } from '../types/server-options';
import { NODE_RES } from '../constans';

@Injectable()
export class Res<T = any> {
  constructor(
    /**
     * Native Node.js response.
     */
    @Inject(NODE_RES) public readonly nodeRes: NodeResponse
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
    const contentType = this.nodeRes.getHeader('Content-Type');
    if (!contentType) {
      this.setContentType('text/plain; charset=utf-8');
    }
    this.nodeRes.statusCode = statusCode;
    this.nodeRes.end(data || '');
  }

  /**
   * To convert `any` type to `string` type, the `util.format()` function is used here.
   */
  sendText(data?: any, statusCode: Status = Status.OK): void {
    this.send(format(data), statusCode);
  }

  sendJson(data?: T, statusCode: Status = Status.OK): void {
    this.setContentType('application/json; charset=utf-8').send(JSON.stringify(data), statusCode);
  }

  redirect(statusCode: RedirectStatusCodes, path: string) {
    this.nodeRes.writeHead(statusCode, { Location: path });
    this.nodeRes.end();
  }
}
