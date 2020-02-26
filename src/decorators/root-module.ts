import * as http from 'http';
import { ListenOptions } from 'net';
import { makeDecorator, Provider, ReflectiveInjector, Injector } from '@ts-stack/di';
import { Router as RestifyRouter } from '@ts-stack/router';

import { PreRequest } from '../services/pre-request';
import { ModuleDecorator } from './module';
import { ImportsWithPrefix, Router } from '../types/router';
import { BodyParserConfig } from '../types/types';
import { Logger } from '../types/logger';
import { HttpModule, ServerOptions } from '../types/server-options';

export const defaultProvidersPerApp: Readonly<Provider[]> = Object.freeze([
  Logger,
  BodyParserConfig,
  { provide: Router, useClass: RestifyRouter },
  PreRequest,
  {
    provide: ReflectiveInjector,
    useExisting: Injector
  }
]);

export interface RootModuleDecoratorFactory {
  (data?: RootModuleDecorator): any;
  new (data?: RootModuleDecorator): RootModuleDecorator;
}

export interface RootModuleDecorator extends ModuleDecorator, Partial<ApplicationMetadata> {}

export const RootModule = makeDecorator('RootModule', (data: any) => data) as RootModuleDecoratorFactory;

export class ApplicationMetadata {
  serverName: string = 'Node.js';
  httpModule: HttpModule = http;
  serverOptions: ServerOptions = {};
  listenOptions: ListenOptions = { host: 'localhost', port: 8080 };
  /**
   * Providers per the `Application`.
   */
  providersPerApp: Provider[] = [];
  prefixPerApp: string = '';
}
