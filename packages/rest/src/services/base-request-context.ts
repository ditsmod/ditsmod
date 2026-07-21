import { Context, injectable, type AnyObj } from '@ditsmod/core';
import { TLSSocket } from 'node:tls';
import { randomUUID } from 'node:crypto';

import type { RawRequest, RawResponse } from './request.js';
import type { RedirectStatusCodes } from '#types/types.js';
import type { ServerResponse } from 'node:http';
import type { PathParam } from './router.js';

@injectable()
export abstract class BaseRequestContext<T = any> extends Context {
  rawReq: RawRequest;
  rawRes: RawResponse;
  rawPathParams: PathParam[] | null;
  queryString: string;
  pathParams?: AnyObj;
  queryParams?: AnyObj;
  body?: any;
  auth?: any;
  /**
   * Indicates in which mode the controller methods work.
   *
   * The operation of the controller in `route` mode means that its methods,
   * which are bound to routes, receive a single argument - an object containing
   * context data, including native request objects.
   */
  scope?: 'route';
  #requestId: string;

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
    // @todo Refactoring this for HTTP2
    (this.rawRes as ServerResponse).writeHead(statusCode, { Location: path }).end();
  }

  get requestId() {
    if (!this.#requestId) {
      this.#requestId = randomUUID();
    }
    return this.#requestId;
  }

  get protocol() {
    return this.rawReq.socket instanceof TLSSocket && this.rawReq.socket.encrypted ? 'https' : 'http';
  }
}
