import { ServerOptions } from '../types/server-options';
import { HttpModule } from '../types/http-module';

export class ApplicationOptions {
  httpModule?: HttpModule | null = null;
  serverOptions?: ServerOptions = {};
  path?: string = '';
}
