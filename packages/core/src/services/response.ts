import { format } from 'util';

import { NODE_RES } from '#constans';
import { inject, injectable } from '#di';
import { HttpHeaders, RedirectStatusCodes } from '#types/mix.js';
import { NodeResponse } from '#types/server-options.js';
import { Status } from '#utils/http-status-codes.js';

@injectable()
export class Res<T = any> {
  constructor(
    /**
     * Native Node.js response.
     */
    @inject(NODE_RES) public nodeRes: NodeResponse,
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

  setHeaders(headrs: HttpHeaders = {}) {
    Object.entries(headrs).forEach(([key, value]) => this.nodeRes.setHeader(key, value));
    return this;
  }

  /**
   * Send data as is, without any transformation.
   */
  send(data?: string | Buffer | Uint8Array, statusCode: Status = Status.OK, headrs?: HttpHeaders): void {
    const contentType = this.nodeRes.getHeader('Content-Type');
    if (!contentType) {
      this.setHeaders({ 'Content-Type': 'text/plain; charset=utf-8', ...headrs });
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

  sendJson(data?: T, statusCode: Status = Status.OK, headrs?: HttpHeaders): void {
    this
      .setHeaders({ 'Content-Type': 'application/json; charset=utf-8', ...headrs })
      .send(JSON.stringify(data), statusCode);
  }

  redirect(statusCode: RedirectStatusCodes, path: string) {
    this.nodeRes.writeHead(statusCode, { Location: path });
    this.nodeRes.end();
  }
}
