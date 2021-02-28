import { makeDecorator, Provider, ReflectiveInjector, Injector, Type } from '@ts-stack/di';

import { ModuleDecorator } from './module';
import { BodyParserConfig, Extension } from '../types/types';
import { Logger, LoggerConfig } from '../types/logger';
import { DefaultLogger } from '../services/default-logger';
import { AppMetadata } from './app-metadata';
import { Counter } from '../services/counter';
import { PreRoutes } from '../services/pre-routes';
import { PreRouter } from '../services/pre-router';

export const defaultProvidersPerApp: Provider[] = [
  LoggerConfig,
  { provide: Logger, useClass: DefaultLogger },
  BodyParserConfig,
  {
    provide: ReflectiveInjector,
    useExisting: Injector,
  },
  PreRouter,
  PreRoutes,
  Counter,
];

export const defaultExtensions: Type<Extension>[] = [PreRouter];

export interface RootModuleDecoratorFactory {
  (data?: RootModuleDecorator): any;
  new (data?: RootModuleDecorator): RootModuleDecorator;
}

export interface RootModuleDecorator extends ModuleDecorator, Partial<AppMetadata> {}

export const RootModule = makeDecorator('RootModule', (data: any) => data) as RootModuleDecoratorFactory;
