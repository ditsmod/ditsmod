import { featureModule, ModuleWithParams, Providers } from '@ditsmod/core';
import { optional } from '@ts-stack/di';

import { SessionCookie } from './session-cookie';
import { SessionLogMediator } from './session-log-mediator';
import { SessionCookieOptions } from './types';

@featureModule({
  providersPerMod: [SessionLogMediator],
  providersPerReq: [SessionCookie],
  exports: [SessionCookie],
})
export class SessionCookieModule {
  static withParsms(opts: SessionCookieOptions): ModuleWithParams<SessionCookieModule> {
    return {
      module: this,
      providersPerMod: [{ token: SessionCookieOptions, useValue: opts }],
      exports: [SessionCookieOptions],
    };
  }

  constructor(log: SessionLogMediator, @optional() opts?: SessionCookieOptions) {
    if (opts?.expires && opts.maxAge) {
      log.cannotSetExpireAndMaxAge(this);
    }
  }
}
