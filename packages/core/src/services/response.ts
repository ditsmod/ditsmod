import { RES } from '#constans';
import { inject, injectable } from '#di';
import { RedirectStatusCodes } from '#types/mix.js';
import { HttpResponse } from '#types/server-options.js';
import { Status } from '#utils/http-status-codes.js';

@injectable()
export class Res<T = any> {
  constructor(
    /**
     * Native Node.js response.
     */
    @inject(RES) public httpRes: HttpResponse,
  ) {}

  /**
   * Setting value to the response header `Content-Type`.
   *
   * @example
   *
   * res.setContentType('application/xml').send({ one: 1, two: 2 });
   */
  setContentType(contentType: string) {
    this.httpRes.setHeader('Content-Type', contentType);
    return this;
  }

  setHeader(key: string, value: string | number | string[]) {
    this.httpRes.setHeader(key, value);
    return this;
  }

  /**
   * Send data as is, without any transformation.
   */
  send(data?: string | Buffer | Uint8Array, statusCode: Status = Status.OK): void {
    if (!this.httpRes.getHeader('Content-Type')) {
      this.httpRes.setHeader('Content-Type', 'text/plain; charset=utf-8');
    }
    this.httpRes.statusCode = statusCode;
    this.httpRes.end(data || '');
  }

  sendJson(data?: T, statusCode: Status = Status.OK): void {
    this.setHeader('Content-Type', 'application/json; charset=utf-8').send(JSON.stringify(data), statusCode);
  }

  redirect(statusCode: RedirectStatusCodes, path: string) {
    this.httpRes.writeHead(statusCode, { Location: path }).end();
  }
}
