import { Injector, ReflectiveInjector } from '@ts-stack/di';

import { BodyParserConfig } from '../models/body-parser-config';
import { RootMetadata } from '../models/root-metadata';
import { Logger, LoggerConfig } from '../types/logger';
import { ServiceProvider } from '../types/service-provider';
import { DefaultLogger } from './default-logger';
import { ModuleManager } from './module-manager';
import { PreRouter } from './pre-router';
import { PreRoutes } from './pre-routes';

export const defaultProvidersPerApp: ServiceProvider[] = [
  LoggerConfig,
  { provide: Logger, useClass: DefaultLogger },
  BodyParserConfig,
  {
    provide: ReflectiveInjector,
    useExisting: Injector,
  },
  PreRouter,
  PreRoutes,
  RootMetadata,
  ModuleManager
];
