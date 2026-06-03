import { Context, injectable, optional, type AnyObj } from '@ditsmod/core';
import { TLSSocket } from 'node:tls';
import { randomUUID } from 'node:crypto';

import type { RawRequest, RawResponse } from './request.js';
import type { PathParam } from './router.js';
import { A_PATH_PARAMS, QUERY_STRING, RAW_REQ, RAW_RES } from '#types/constants.js';
import type { RedirectStatusCodes } from '#types/types.js';
import type { ServerResponse } from 'node:http';

@injectable()
export class RequestContext<T = any> extends Context {
  pathParams?: AnyObj;
  queryParams?: AnyObj;
  body?: any;
  auth?: any;
  #requestId: string;

  constructor(
    @optional() public rawReq: RawRequest,
    @optional() public rawRes: RawResponse,
    @optional() public aPathParams: PathParam[] | null,
    @optional() public queryString: string,
    /**
     * Indicates in which mode the controller methods work.
     *
     * The operation of the controller in `route` mode means that its methods,
     * which are bound to routes, receive a single argument - an object containing
     * context data, including native request objects.
     */
    @optional() public scope?: 'route',
  ) {
    super();
  }

  /**
   * This method is intended for use in `request-scoped` mode only.
   */
  setCtx(rawReq: RawRequest, rawRes: RawResponse, aPathParams: PathParam[] | null, queryString: string) {
    this.rawReq = rawReq;
    this.rawRes = rawRes;
    this.aPathParams = aPathParams;
    this.queryString = queryString;

    this.set(RAW_REQ, rawReq)
      .set(RAW_RES, rawRes)
      .set(A_PATH_PARAMS, aPathParams)
      .set(QUERY_STRING, queryString || '');
    return this;
  }
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
