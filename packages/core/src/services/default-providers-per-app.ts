import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { ModuleExtract } from '#types/module-extract.js';
import { Logger } from '#logger/logger.js';
import { ServiceProvider } from '#types/mix.js';
import { Providers } from '#utils/providers.js';
import { ConsoleLogger } from '../logger/console-logger.js';
import { Counter } from './counter.js';
import { ModuleManager } from './module-manager.js';
import { PreRouter } from './pre-router.js';

export const defaultProvidersPerApp: Readonly<ServiceProvider[]> = [
  PreRouter,
  Counter,
  ModuleManager,
  SystemLogMediator,
  ...new Providers()
    .useValue<ModuleExtract>(ModuleExtract, { moduleName: 'AppModule' })
    .useClass(Logger, ConsoleLogger),
];
