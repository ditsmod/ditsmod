import { Logger } from '../types/logger';
import { ServiceProvider } from '../types/mix';
import { Counter } from './counter';
import { ConsoleLogger } from './console-logger';
import { ModuleManager } from './module-manager';
import { OutputLogFilter } from '../log-mediator/types';
import { PreRouter } from './pre-router';
import { ModuleExtract } from '../models/module-extract';
import { Providers } from '../utils/providers';
import { SystemLogMediator } from '../log-mediator/system-log-mediator';

export const defaultProvidersPerApp: Readonly<ServiceProvider[]> = [
  PreRouter,
  Counter,
  ModuleManager,
  SystemLogMediator,
  OutputLogFilter,
  ...new Providers()
    .useValue<ModuleExtract>(ModuleExtract, { moduleName: 'AppModule' })
    .useClass(Logger, ConsoleLogger),
];
