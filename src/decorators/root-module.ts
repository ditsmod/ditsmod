import * as http from 'http';
import { ListenOptions } from 'net';
import { makeDecorator, Provider, ReflectiveInjector, Injector } from 'ts-di';
import { Router as RestifyRouter } from '@restify-ts/router';

import { PreRequest } from '../services/pre-request';
import { ModuleDecorator } from './module';
import { RoutesPrefixPerMod, Router } from '../types/router';
import { BodyParserConfig } from '../types/types';
import { Logger } from '../types/logger';
import { HttpModule, ServerOptions } from '../types/server-options';
import { EntityInjector } from '../modules/orm/decorators/entity';
import { ApplicationInitStatus } from '../application-init-status';

export const defaultProvidersPerApp: Provider[] = [
  ApplicationInitStatus,
  Logger,
  BodyParserConfig,
  { provide: Router, useClass: RestifyRouter },
  PreRequest,
  {
    provide: ReflectiveInjector,
    useExisting: Injector
  },
  {
    provide: EntityInjector,
    useValue: null
  }
];

export interface RootModuleDecoratorFactory {
  (data?: RootModuleDecorator): any;
  new (data?: RootModuleDecorator): RootModuleDecorator;
}

export interface RootModuleDecorator extends ModuleDecorator, Partial<ApplicationMetadata> {
  exports?: never;
}

export const RootModule = makeDecorator('RootModule', (data: any) => data) as RootModuleDecoratorFactory;

export class ApplicationMetadata {
  serverName: string = 'Node.js';
  httpModule: HttpModule = http;
  serverOptions: ServerOptions = {};
  listenOptions: ListenOptions = { host: 'localhost', port: 8080 };
  /**
   * Providers per the `Application`.
   */
  providersPerApp: Provider[] = defaultProvidersPerApp;
  routesPrefixPerApp: string = '';
  routesPrefixPerMod: RoutesPrefixPerMod[] = [];
}
