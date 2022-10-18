import { Module, Providers } from '@ditsmod/core';
import { Optional } from '@ts-stack/di';

import { SessionCookie } from './session-cookie';
import { SessionLogMediator } from './session-log-mediator';
import { SessionCookieOptions } from './types';

@Module({
  providersPerMod: [...new Providers().useLogMediator(SessionLogMediator)],
  providersPerReq: [SessionCookie],
  exports: [SessionCookie],
})
export class SessionCookieModule {
  constructor(log: SessionLogMediator, @Optional() opts?: SessionCookieOptions) {
    if (opts?.expires && opts.maxAge) {
      log.cannotSetExpireAndMaxAge(this);
    }
  }
}
