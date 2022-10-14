import { Injector, ReflectiveInjector } from '@ts-stack/di';

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

export const defaultProvidersPerApp: Readonly<ServiceProvider[]> = [
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
  ...new Providers()
    .useValue<ModuleExtract>(ModuleExtract, { moduleName: 'AppModule' })
    .useClass(Logger, ConsoleLogger),
];
