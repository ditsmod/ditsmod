import { HttpHandler, HttpInterceptor, injectable, optional } from '@ditsmod/core';

import { RequestContextWithSession, SessionCookieOptions } from './types.js';
import { SessionCookie } from './session-cookie.js';

@injectable()
export class SessionCookieInterceptor implements HttpInterceptor {
  constructor(@optional() protected opts: SessionCookieOptions) {}

  async intercept(next: HttpHandler, ctx: RequestContextWithSession) {
    ctx.sessionCookie = new SessionCookie(ctx.nodeReq, ctx.nodeRes, this.opts);
    return next.handle();
  }
}
