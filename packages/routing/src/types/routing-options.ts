import { AppOptions } from '@ditsmod/core';
import { HttpModule } from '../module/http-module.js';
import { ServerOptions } from './server-options.js';

export class AppOptions extends AppOptions {
  httpModule?: HttpModule | null = null;
  serverOptions?: ServerOptions = {};
  /**
   * This is the root prefix that will be added to all routes.
   */
  path?: string = '';
}
