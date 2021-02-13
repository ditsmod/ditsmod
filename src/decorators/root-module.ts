import * as http from 'http';
import { ListenOptions } from 'net';
import { makeDecorator, Provider, ReflectiveInjector, Injector } from '@ts-stack/di';

import { PreRequest } from '../services/pre-request';
import { ModuleDecorator } from './module';
import { BodyParserConfig } from '../types/types';
import { Logger, LoggerConfig } from '../types/logger';
import { HttpModule, ServerOptions } from '../types/server-options';
import { DefaultLogger } from '../services/default-logger';
import { PreRouting } from '../pre-routing';

export const defaultProvidersPerApp: Readonly<Provider[]> = [
  LoggerConfig,
  { provide: Logger, useClass: DefaultLogger },
  BodyParserConfig,
  PreRequest,
  {
    provide: ReflectiveInjector,
    useExisting: Injector,
  },
  PreRouting
];

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
