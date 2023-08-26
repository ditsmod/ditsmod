import { Logger } from '../types/logger.js';
import { ServiceProvider } from '../types/mix.js';
import { Counter } from './counter.js';
import { ConsoleLogger } from './console-logger.js';
import { ModuleManager } from './module-manager.js';
import { OutputLogFilter } from '../log-mediator/types.js';
import { PreRouter } from './pre-router.js';
import { ModuleExtract } from '../models/module-extract.js';
import { Providers } from '../utils/providers.js';
import { SystemLogMediator } from '../log-mediator/system-log-mediator.js';

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
