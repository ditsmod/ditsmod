import { Cookies } from '@ts-stack/cookies';
import { AnyFn, HttpRequest, HttpResponse, inject, injectable, HTTP_REQ, HTTP_RES, optional } from '@ditsmod/core';

import { SessionCookieOptions } from './types.js';

@injectable()
export class SessionCookie {
  protected _id: string | null = '';
  protected cookies: Cookies;
  protected maxAge: number;

  constructor(
    @inject(HTTP_REQ) httpReq: HttpRequest,
    @inject(HTTP_RES) httpRes: HttpResponse,
    @optional() protected opts: SessionCookieOptions,
  ) {
    this.opts = { ...(opts || {}) };
    this.cookies = new Cookies(httpReq, httpRes);
    this.opts.cookieName ??= 'session_id';
    this.maxAge = this.opts.maxAge === undefined ? 1000 * 60 * 60 * 24 : this.opts.maxAge; // By default - 24 hours

    const writeHead = httpRes.writeHead as AnyFn;
    httpRes.writeHead = (...args: any[]) => {
      this.updateSessionCookie();
      return writeHead.apply(httpRes, args);
    };
  }

  get id() {
    if (!this._id) {
      this._id = this.cookies.get(this.opts.cookieName!) || '';
    }
    return this._id;
  }

  set id(value: string) {
    this._id = value;
  }

  protected updateSessionCookie() {
    if (this.id || this.id === null) {
      this.opts.expires ??= new Date(new Date().getTime() + this.maxAge);
      this.cookies.set(this.opts.cookieName!, this.id, this.opts);
    }
  }

  /**
   * If `newMaxAge` < 1, id will be reset.
   */
  setMaxAge(newMaxAge: number) {
    if (newMaxAge < 1) {
      this._id = null;
    }
    this.maxAge = newMaxAge;
  }
}
