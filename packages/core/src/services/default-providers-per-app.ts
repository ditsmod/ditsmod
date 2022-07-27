import { Injector, ReflectiveInjector } from '@ts-stack/di';

import { BodyParserConfig } from '../models/body-parser-config';
import { RootMetadata } from '../models/root-metadata';
import { Logger, LoggerConfig } from '../types/logger';
import { ServiceProvider } from '../types/mix';
import { Counter } from './counter';
import { ConsoleLogger } from './console-logger';
import { ModuleManager } from './module-manager';
import { LogMediator, LogMediatorConfig } from './log-mediator';
import { PreRouter } from './pre-router';

export const defaultProvidersPerApp: Readonly<ServiceProvider[]> = [
  LoggerConfig,
  { provide: Logger, useClass: ConsoleLogger },
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
  LogMediatorConfig,
];
