import { BaseAppOptions } from '@ditsmod/core';

import { HttpModule } from '#module/http-module.js';
import { ServerOptions } from '#types/server-options.js';

export class AppOptions extends BaseAppOptions {
  httpModule?: HttpModule | null = null;
  serverOptions?: ServerOptions = {};
  /**
   * This is the root prefix that will be added to all routes.
   */
  path?: string = '';
}
