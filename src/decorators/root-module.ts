import * as http from 'http';
import { ListenOptions } from 'net';
import { makeDecorator, Provider } from 'ts-di';

import { defaultProvidersPerApp } from '../types/default-providers';
import { ModuleDecorator } from './module';
import { RoutesPrefixPerMod } from '../types/router';
import { HttpModule, ServerOptions } from '../types/types';

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
