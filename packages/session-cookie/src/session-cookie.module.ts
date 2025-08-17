import { featureModule, ModuleWithParams, optional } from '@ditsmod/core';
import { initRest, PreRouterExtension, RoutesExtension } from '@ditsmod/rest';

import { SessionCookie } from './session-cookie.js';
import { SessionLogMediator } from './session-log-mediator.js';
import { SessionCookieOptions } from './types.js';
import { SessionCookieExtension } from './session-cookie.extension.js';

@initRest({
  providersPerMod: [SessionLogMediator],
  providersPerReq: [SessionCookie],
  extensions: [
    {
      extension: SessionCookieExtension,
      afterExtensions: [RoutesExtension],
      beforeExtensions: [PreRouterExtension],
      exportOnly: true,
    },
  ],
  exports: [SessionCookie],
})
@featureModule()
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
