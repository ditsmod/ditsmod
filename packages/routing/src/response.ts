import { inject, injectable } from '@ditsmod/core';

import { RAW_RES } from './constants.js';
import { RawResponse } from './request.js';
import { RedirectStatusCodes } from './types.js';

@injectable()
export class Res<T = any> {
  constructor(
    /**
     * Native webserver response.
     */
    @inject(RAW_RES) public rawRes: RawResponse,
  ) {}

  /**
   * Setting value to the response header `Content-Type`.
   *
   * @example
   *
   * res.setContentType('application/xml').send({ one: 1, two: 2 });
   */
  setContentType(contentType: string) {
    this.rawRes.setHeader('Content-Type', contentType);
    return this;
  }

  setHeader(key: string, value: string | number | string[]) {
    this.rawRes.setHeader(key, value);
    return this;
  }

  /**
   * Send data as is, without any transformation.
   */
  send(data?: string | Buffer | Uint8Array): void {
    this.rawRes.end(data || '');
  }

  sendJson(data?: T): void {
    this.setHeader('Content-Type', 'application/json; charset=utf-8').send(JSON.stringify(data));
  }

  redirect(statusCode: RedirectStatusCodes, path: string) {
    this.rawRes.writeHead(statusCode, { Location: path }).end();
  }
}
