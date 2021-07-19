import { CookieOptions } from '@ts-stack/cookies';

export class SessionCookieOptions extends CookieOptions {
  cookieName?: string;
  /**
   * If `expires` < `activeDuration`, the session will be extended
   * by `activeDuration` milliseconds.
   */
  activeDuration?: number;
}
