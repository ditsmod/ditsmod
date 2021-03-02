import { ListenOptions } from 'net';

import { ServerOptions } from '../types/server-options';
import { HttpModule } from '../types/http-module';

export interface RootModuleMetadata {
  httpModule?: HttpModule;
  serverName?: string;
  serverOptions?: ServerOptions;
  listenOptions?: ListenOptions;
  prefixPerApp?: string;
}
