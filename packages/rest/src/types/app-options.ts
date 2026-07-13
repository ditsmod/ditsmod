import { BaseAppOptions } from '@ditsmod/core';

import type { HttpModule } from '#init/http-module.js';
import type { ServerOptions } from '#types/server-options.js';

export class AppOptions extends BaseAppOptions {
  httpModule?: HttpModule | null = null;
  serverOptions?: ServerOptions = {};
  /**
   * This is the root prefix that will be added to all routes.
   */
  path?: string = '';
  /**
   * Time in milliseconds to wait for active connections to close during graceful shutdown.
   * If this timeout is reached, all remaining connections will be forcefully closed.
   *
   * Default - `15000` (15 seconds).
   */
  shutdownTimeout?: number = 15000;
}
