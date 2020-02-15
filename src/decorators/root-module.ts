import * as http from 'http';
import { ListenOptions } from 'net';
import { makeDecorator, Provider, forwardRef, ReflectiveInjector, Injector } from 'ts-di';
import { Router as RestifyRouter } from '@restify-ts/router';

import { PreRequest } from '../services/pre-request';
import { ModuleFactory } from '../module-factory';
import { EntityInjector } from '../decorators/entity';
import { ModuleDecorator } from './module';
import { RoutesPrefixPerMod, Router } from '../types/router';
import { HttpModule, ServerOptions, Logger, BodyParserConfig } from '../types/types';

export const defaultProvidersPerApp: Provider[] = [
  Logger,
  BodyParserConfig,
  { provide: Router, useClass: RestifyRouter },
  forwardRef(() => ModuleFactory),
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
  entities: Provider[] = [];
}
