import { Logger, Module } from '@ditsmod/core';

import { SessionCookie } from './session-cookie';
import { SessionCookieOptions } from './types';

@Module({
  providersPerMod: [SessionCookieOptions],
  providersPerReq: [SessionCookie],
  exports: [SessionCookie, SessionCookieOptions],
})
export class SessionCookieModule {
  constructor(opts: SessionCookieOptions, logger: Logger) {
    if (opts.expires && opts.maxAge) {
      logger.warn(
        'You cannot set opts.expires and opts.maxAge at the same time. For now, opts.maxAge will be ignored.'
      );
    }
  }
}
