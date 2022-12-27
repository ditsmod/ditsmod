import { Cookies, NodeRequest, NodeResponse } from '@ts-stack/cookies';
import { inject, injectable, optional } from '@ditsmod/core';
import { NODE_REQ, NODE_RES } from '@ditsmod/core';

import { SessionCookieOptions } from './types';

@injectable()
export class SessionCookie {
  protected _id: string | null = '';
  protected cookies: Cookies;
  protected maxAge: number;

  constructor(
    @inject(NODE_REQ) req: NodeRequest,
    @inject(NODE_RES) res: NodeResponse,
    @optional() protected opts: SessionCookieOptions
  ) {
    this.opts = { ...(opts || {}) };

    this.cookies = new Cookies(req, res);
    this.opts.cookieName = opts.cookieName || 'session_id';
    this.maxAge = opts.maxAge === undefined ? 1000 * 60 * 60 * 24 : opts.maxAge; // By default - 24 hours

    const writeHead = res.writeHead as Function;
    res.writeHead = (...args: any[]) => {
      this.updateSessionCookie();
      return writeHead.apply(res, args);
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
      this.opts.expires = this.opts.expires || new Date(new Date().getTime() + this.maxAge);
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
