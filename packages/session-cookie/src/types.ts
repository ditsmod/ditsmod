/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { CookieOptions } from '@ts-stack/cookies';

export class SessionCookieOptions extends CookieOptions {
  /**
   * Cookie name dictates the key name added to the request object.
   */
  cookieName?: string;
  /**
   * How long the session will stay valid in ms.
   */
  duration?: number;
  /**
   * If `expires` < `activeDuration`, the session will be extended
   * by `activeDuration` milliseconds.
   */
  activeDuration?: number;
}
