import * as http from 'http';
import { ListenOptions } from 'net';
import { makeDecorator, Provider, ReflectiveInjector, Injector } from '@ts-stack/di';

import { PreRequest } from '../services/pre-request';
import { ModuleDecorator } from './module';
import { BodyParserConfig } from '../types/types';
import { Logger, LoggerConfig } from '../types/logger';
import { HttpModule, ServerOptions } from '../types/server-options';
import { deepFreeze } from '../utils/deep-freeze';
import { DefaultLogger } from '../services/default-logger';
import { Router } from '../types/router';

const providersPerApp: Provider[] = [
  LoggerConfig,
  { provide: Logger, useClass: DefaultLogger },
  BodyParserConfig,
  PreRequest,
  {
    provide: ReflectiveInjector,
    useExisting: Injector,
  },
];

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const optional = require('@ts-stack/router');
  providersPerApp.push({ provide: Router, useClass: optional.DefaultRouter });
} catch {
  providersPerApp.push(Router);
}

export const defaultProvidersPerApp: Readonly<Provider[]> = deepFreeze(providersPerApp);

export interface RootModuleDecoratorFactory {
  (data?: RootModuleDecorator): any;
  new (data?: RootModuleDecorator): RootModuleDecorator;
}

export interface RootModuleDecorator extends ModuleDecorator, Partial<ApplicationMetadata> {}

export const RootModule = makeDecorator('RootModule', (data: any) => data) as RootModuleDecoratorFactory;

export class ApplicationMetadata {
  httpModule: HttpModule = http;
  serverName = 'Node.js';
  serverOptions: ServerOptions = {};
  listenOptions: ListenOptions = { host: 'localhost', port: 8080 };
  prefixPerApp = '';
  /**
   * Providers per the `Application`.
   */
  providersPerApp: Provider[] = [];
}
