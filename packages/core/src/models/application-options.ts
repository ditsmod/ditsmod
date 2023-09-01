import { HttpModule } from '#types/http-module.js';
import { ServerOptions } from '#types/server-options.js';

export class ApplicationOptions {
  httpModule?: HttpModule | null = null;
  serverOptions?: ServerOptions = {};
  path?: string = '';
}
