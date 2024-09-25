import { NODE_RES } from '#constans';
import { inject, injectable } from '#di';
import { RedirectStatusCodes } from '#types/mix.js';
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

  setHeader(key: string, value: string | number | string[]) {
    this.nodeRes.setHeader(key, value);
    return this;
  }

  /**
   * Send data as is, without any transformation.
   */
  send(data?: string | Buffer | Uint8Array, statusCode: Status = Status.OK): void {
    if (!this.nodeRes.getHeader('Content-Type')) {
      this.nodeRes.setHeader('Content-Type', 'text/plain; charset=utf-8');
    }
    this.nodeRes.statusCode = statusCode;
    this.nodeRes.end(data || '');
  }

  sendJson(data?: T, statusCode: Status = Status.OK): void {
    this.setHeader('Content-Type', 'application/json; charset=utf-8').send(JSON.stringify(data), statusCode);
  }

  redirect(statusCode: RedirectStatusCodes, path: string) {
    this.nodeRes.writeHead(statusCode, { Location: path }).end();
  }
}
