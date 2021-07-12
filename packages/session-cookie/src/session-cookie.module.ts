import { Module } from '@ditsmod/core';

import { SessionCookie } from './session-cookie';
import { SessionCookieOptions } from './types';

@Module({
  providersPerReq: [SessionCookie],
  providersPerMod: [SessionCookieOptions],
  exports: [SessionCookie, SessionCookieOptions]
})
export class SessionCookieModule {}
