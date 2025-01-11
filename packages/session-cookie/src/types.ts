import { RequestContext } from '@ditsmod/routing';
import { CookieOptions } from '@ts-stack/cookies';
import { SessionCookie } from './session-cookie.js';

export class SessionCookieOptions extends CookieOptions {
  cookieName?: string;
}

export interface RequestContextWithSession extends RequestContext {
  sessionCookie: SessionCookie;
}
