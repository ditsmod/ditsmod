import * as http from 'http';
import { ListenOptions } from 'net';
import { Provider, Type } from '@ts-stack/di';

import { HttpModule, ServerOptions } from '../types/server-options';
import { Extension } from '../types/types';

export class AppMetadata {
  httpModule: HttpModule = http;
  serverName = 'Node.js';
  serverOptions: ServerOptions = {};
  listenOptions: ListenOptions = { host: 'localhost', port: 8080 };
  prefixPerApp = '';
  /**
   * Providers per the `Application`.
   */
  providersPerApp: Provider[] = [];
  extensions: Type<Extension>[] = [];
}
