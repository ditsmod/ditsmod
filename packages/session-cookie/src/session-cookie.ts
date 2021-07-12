/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Cookies, NodeRequest, NodeResponse } from '@ts-stack/cookies';
import { Inject, Injectable } from '@ts-stack/di';
import { NODE_REQ, NODE_RES } from '@ditsmod/core';

import { SessionCookieOptions } from './types';

@Injectable()
export class SessionCookie {
  protected _id: string;
  protected loaded: boolean;
  protected dirty: boolean;
  protected cookies: Cookies;
  protected createdAt: number;
  protected expires: Date;
  protected activeDuration: number;
  protected duration: number;

  constructor(@Inject(NODE_REQ) req: NodeRequest, @Inject(NODE_RES) res: NodeResponse, protected opts: SessionCookieOptions) {
    this.opts = { ...opts };

    this.cookies = new Cookies(req, res);
    this.id = '';
    this.loaded = false;
    this.dirty = false;
    this.createdAt = 0;
    this.opts.cookieName = opts.cookieName || 'session_state';
    this.duration = opts.duration || 24 * 60 * 60 * 1000; // 24 hours
    this.activeDuration = opts.activeDuration || 5 * 60 * 1000; // 5min

    if (opts.maxAge) {
      this.expires = new Date(new Date().getTime() + opts.maxAge);
    } else {
      this.setExpires();
    }

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

  protected setExpires() {
    if (this.opts.maxAge) {
      return;
    }

    const time = this.createdAt || new Date().getTime();
    // We add an extra second because the conversion to a date truncates the milliseconds
    this.expires = new Date(time + this.duration + 1000);
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

  protected loadFromCookie(forceReset?: boolean) {
    const id = this.cookies.get(this.opts.cookieName!);
    if (id) {
      this._id = id || '';
      this.setExpires();

      const expiresAt = this.createdAt + this.duration;
      const now = Date.now();
      // Should we reset this session?
      if (expiresAt < now) {
        this.reset();
        // If expiration is soon, push back a few minutes to not interrupt user
      } else if (expiresAt - now < this.activeDuration) {
        this.createdAt += this.activeDuration;
        this.dirty = true;
        this.setExpires();
      }
    } else {
      if (forceReset) {
        this.reset();
      } else {
        return false; // Didn't actually load the cookie
      }
    }

    this.loaded = true;
    return true;
  }

  reset() {
    this._id = '';
    this.createdAt = new Date().getTime();
    this.duration = this.opts.duration || 0;
    this.setExpires();
    this.dirty = true;
    this.loaded = true;
  }

  setDuration(newDuration: number) {
    if (!this.loaded) {
      this.loadFromCookie(true);
    }
    this.dirty = true;
    this.duration = newDuration;
    this.createdAt = new Date().getTime();
    this.setExpires();
  }
}
