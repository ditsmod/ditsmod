import { featureModule, ModuleWithParams, optional } from '@ditsmod/core';
import { PreRouterExtension, RoutesExtension } from '@ditsmod/rest';

import { SessionCookie } from './session-cookie.js';
import { SessionLogMediator } from './session-log-mediator.js';
import { SessionCookieOptions } from './types.js';
import { SessionCookieExtension } from './session-cookie.extension.js';

@featureModule({
  providersPerMod: [SessionLogMediator],
  providersPerReq: [SessionCookie],
  exports: [SessionCookie],
  extensions: [
    {
      extension: SessionCookieExtension,
      afterExtensions: [RoutesExtension],
      beforeExtensions: [PreRouterExtension],
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
