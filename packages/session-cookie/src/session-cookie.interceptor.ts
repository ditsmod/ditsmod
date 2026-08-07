import { injectable, optional } from '@holu/core';
import { HttpHandler, HttpInterceptor } from '@holu/rest';

import { RequestContextWithSession, SessionCookieOptions } from './types.js';
import { SessionCookie } from './session-cookie.js';

@injectable()
export class SessionCookieInterceptor implements HttpInterceptor {
  constructor(@optional() protected opts: SessionCookieOptions) {}

  async intercept(next: HttpHandler, ctx: RequestContextWithSession) {
    ctx.sessionCookie = new SessionCookie(ctx.rawReq, ctx.rawRes, this.opts);
    return next.handle();
  }
}
