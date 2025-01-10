import { featureModule, ModuleWithParams, optional } from '@ditsmod/core';
import { PRE_ROUTER_EXTENSIONS, ROUTE_EXTENSIONS } from '@ditsmod/routing';

import { SessionCookie } from './session-cookie.js';
import { SessionLogMediator } from './session-log-mediator.js';
import { SessionCookieOptions } from './types.js';
import { SESSION_COOKIE_EXTENSIONS, SessionCookieExtension } from './session-cookie.extension.js';

@featureModule({
  providersPerMod: [SessionLogMediator],
  providersPerReq: [SessionCookie],
  exports: [SessionCookie],
  extensions: [
    {
      extension: SessionCookieExtension,
      group: SESSION_COOKIE_EXTENSIONS,
      afterGroups: [ROUTE_EXTENSIONS],
      beforeGroups: [PRE_ROUTER_EXTENSIONS],
      exportOnly: true,
    },
  ],
})
export class SessionCookieModule {
  static withParams(opts: SessionCookieOptions): ModuleWithParams<SessionCookieModule> {
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
