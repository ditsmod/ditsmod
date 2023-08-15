import { ListenOptions } from 'net';

import { ServerOptions } from '../types/server-options';
import { HttpModule } from '../types/http-module';

export class RootMetadata {
  httpModule: HttpModule | null = null;
  serverOptions: ServerOptions = {};
  listenOptions: ListenOptions = { host: 'localhost', port: 3000 };
  path = '';
}
