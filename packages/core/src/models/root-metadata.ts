import * as http from 'http';
import { ListenOptions } from 'net';
import { InjectionToken } from '@ts-stack/di';

import { ServerOptions } from '../types/server-options';
import { HttpModule } from '../types/http-module';
import { ServiceProvider } from '../types/mix';
import { Extension } from '../types/extension';

/**
 * @todo Rename this to `RootMetadata`.
 */
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
