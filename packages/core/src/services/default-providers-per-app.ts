import { Injector, ReflectiveInjector } from '@ts-stack/di';

import { BodyParserConfig } from '../models/body-parser-config';
import { RootMetadata } from '../models/root-metadata';
import { Logger } from '../types/logger';
import { ServiceProvider } from '../types/mix';
import { Counter } from './counter';
import { ConsoleLogger } from './console-logger';
import { ModuleManager } from './module-manager';
import { LogFilter, LogMediator } from './log-mediator';
import { PreRouter } from './pre-router';
import { ModuleExtract } from '../models/module-extract';
import { Providers } from '../utils/providers';
import { ExtensionsMetaPerApp } from '../models/extensions-meta-per-app';

export const defaultProvidersPerApp: Readonly<ServiceProvider[]> = [
  BodyParserConfig,
  {
    provide: ReflectiveInjector,
    useExisting: Injector,
  },
  RootMetadata,
  PreRouter,
  Counter,
  ModuleManager,
  LogMediator,
  LogFilter,
  ExtensionsMetaPerApp,
  ...new Providers()
    .useValue(ModuleExtract, { moduleName: 'AppModule' })
    .useClass(Logger, ConsoleLogger),
];
