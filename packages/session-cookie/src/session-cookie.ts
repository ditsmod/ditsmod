import { Cookies, NodeRequest, NodeResponse } from '@ts-stack/cookies';
import { Inject, Injectable } from '@ts-stack/di';
import { NODE_REQ, NODE_RES } from '@ditsmod/core';

import { SessionCookieOptions } from './types';

@Injectable()
export class SessionCookie {
  protected _id: string = '';
  protected loaded: boolean = false;
  protected dirty: boolean = false;
  protected cookies: Cookies;
  protected expires: Date;
  protected maxAge: number;

  constructor(
    @Inject(NODE_REQ) req: NodeRequest,
    @Inject(NODE_RES) res: NodeResponse,
    protected opts: SessionCookieOptions
  ) {
    this.opts = { ...opts };

    this.cookies = new Cookies(req, res);
    this.opts.cookieName = opts.cookieName || 'session_id';
    this.maxAge = opts.maxAge === undefined ? 1000 * 60 * 60 * 24 : opts.maxAge; // By default - 24 hours
    this.setExpires();

    const writeHead = res.writeHead as Function;
    res.writeHead = (...args: any[]) => {
      this.updateSessionCookie();
      return writeHead.apply(res, args);
    };
  }

  get id() {
    if (!this.loaded) {
      this.loadFromCookie();
    }
    return this._id;
  }

  set id(value: string) {
    this._id = value;
  }

  protected setExpires(activeDuration: number = 0) {
    this.expires = new Date(new Date().getTime() + this.maxAge + activeDuration);
  }

  protected updateSessionCookie() {
    if (!this.isDirty()) {
      return;
    }

    this.opts.expires = this.expires;
    this.cookies.set(this.opts.cookieName!, this._id, this.opts);
  }

  protected isDirty() {
    return this.dirty || this._id !== '';
  }

  protected loadFromCookie() {
    const id = this.cookies.get(this.opts.cookieName!);
    if (id !== undefined) {
      this._id = id;
      this.setExpires();
      this.loaded = true;
    }
  }

  reset() {
    this._id = '';
    this.maxAge = this.opts.maxAge || 0;
    this.setExpires();
    this.dirty = true;
    this.loaded = true;
  }

  setMaxAge(newMaxAge: number) {
    if (!this.loaded) {
      this.loadFromCookie();
    }
    this.dirty = true;
    this.maxAge = newMaxAge;
    this.setExpires();
  }
}
