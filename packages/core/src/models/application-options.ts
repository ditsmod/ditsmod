import { ServerOptions } from '../types/server-options.js';
import { HttpModule } from '../types/http-module.js';

export class ApplicationOptions {
  httpModule?: HttpModule | null = null;
  serverOptions?: ServerOptions = {};
  path?: string = '';
}
