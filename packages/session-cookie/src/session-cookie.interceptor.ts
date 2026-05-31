import { injectable, optional } from '@ditsmod/core';
import { HttpHandler, HttpInterceptor } from '@ditsmod/rest';

import { RequestContextWithSession, SessionCookieOptions } from './types.js';
import { SessionCookie } from './session-cookie.js';

@injectable()
export class SessionCookieInterceptor implements HttpInterceptor {
  constructor(@optional() protected opts: SessionCookieOptions) {}

  async intercept(next: HttpHandler, reqCtx: RequestContextWithSession) {
    reqCtx.sessionCookie = new SessionCookie(reqCtx.rawReq, reqCtx.rawRes, this.opts);
    return next.handle();
  }
}
