import * as http from 'http';
import { ListenOptions } from 'net';
import { InjectionToken } from '@ts-stack/di';

import { ServerOptions } from '../types/server-options';
import { HttpModule } from '../types/http-module';
import { ServiceProvider, Extension } from '../types/mix';

export class RootMetadata {
  httpModule: HttpModule = http;
  serverName = 'Node.js';
  serverOptions: ServerOptions = {};
  listenOptions: ListenOptions = { host: 'localhost', port: 8080 };
  prefixPerApp = '';
  /**
   * Providers per the `Application`.
   */
  providersPerApp: ServiceProvider[] = [];
  extensions: InjectionToken<Extension<any>[]>[] = [];
}
