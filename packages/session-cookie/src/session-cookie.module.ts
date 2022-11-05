import { Module, ModuleWithParams, Providers } from '@ditsmod/core';
import { Optional } from '@ts-stack/di';

import { SessionCookie } from './session-cookie';
import { SessionLogMediator } from './session-log-mediator';
import { SessionCookieOptions } from './types';

@Module({
  providersPerMod: [SessionLogMediator],
  providersPerReq: [SessionCookie],
  exports: [SessionCookie],
})
export class SessionCookieModule {
  static withParsms(opts: SessionCookieOptions): ModuleWithParams<SessionCookieModule> {
    return {
      module: this,
      providersPerMod: [{ provide: SessionCookieOptions, useValue: opts }],
      exports: [SessionCookieOptions],
    };
  }

  constructor(log: SessionLogMediator, @Optional() opts?: SessionCookieOptions) {
    if (opts?.expires && opts.maxAge) {
      log.cannotSetExpireAndMaxAge(this);
    }
  }
}
