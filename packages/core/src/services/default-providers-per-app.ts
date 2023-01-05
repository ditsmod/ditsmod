import { Injector, ReflectiveInjector } from '../di';

import { RootMetadata } from '../models/root-metadata';
import { Logger } from '../types/logger';
import { ServiceProvider } from '../types/mix';
import { Counter } from './counter';
import { ConsoleLogger } from './console-logger';
import { ModuleManager } from './module-manager';
import { OutputLogFilter } from '../log-mediator/log-mediator';
import { PreRouter } from './pre-router';
import { ModuleExtract } from '../models/module-extract';
import { Providers } from '../utils/providers';
import { SystemLogMediator } from '../log-mediator/system-log-mediator';

export const defaultProvidersPerApp: Readonly<ServiceProvider[]> = [
  {
    token: ReflectiveInjector,
    useToken: Injector,
  },
  RootMetadata,
  PreRouter,
  Counter,
  ModuleManager,
  SystemLogMediator,
  OutputLogFilter,
  ...new Providers()
    .useValue<ModuleExtract>(ModuleExtract, { moduleName: 'AppModule' })
    .useClass(Logger, ConsoleLogger),
];
