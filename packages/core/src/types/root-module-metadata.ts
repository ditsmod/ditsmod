import { ListenOptions } from 'net';

import { ServerOptions } from '../types/server-options';
import { HttpModule } from '../types/http-module';
import { ExtensionsProvider } from './mix';

export interface RootModuleMetadata {
  httpModule?: HttpModule;
  serverName?: string;
  serverOptions?: ServerOptions;
  listenOptions?: ListenOptions;
  prefixPerApp?: string;
  extensions?: ExtensionsProvider[];
}
