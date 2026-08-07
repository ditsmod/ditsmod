import type { RequestContext } from '@holu/rest';
import { CookieOptions } from '@ts-stack/cookies';
import type { SessionCookie } from './session-cookie.js';

export class SessionCookieOptions extends CookieOptions {
  cookieName?: string;
}

export interface RequestContextWithSession extends RequestContext {
  sessionCookie: SessionCookie;
}
