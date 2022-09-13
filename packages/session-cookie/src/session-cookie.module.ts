import { Module, Providers } from '@ditsmod/core';

import { SessionCookie } from './session-cookie';
import { SessionLogMediator } from './session-log-mediator';
import { SessionCookieOptions } from './types';

@Module({
  providersPerMod: [SessionCookieOptions, ...new Providers().useLogMediator(SessionLogMediator)],
  providersPerReq: [SessionCookie],
  exports: [SessionCookie, SessionCookieOptions],
})
export class SessionCookieModule {
  constructor(opts: SessionCookieOptions, log: SessionLogMediator) {
    if (opts.expires && opts.maxAge) {
      log.cannotSetExpireAndMaxAge(this);
    }
  }
}
