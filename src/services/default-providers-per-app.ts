import { Injector, ReflectiveInjector } from '@ts-stack/di';

import { BodyParserConfig } from '../models/body-parser-config';
import { Logger, LoggerConfig } from '../types/logger';
import { ServiceProvider } from '../types/service-provider';
import { Counter } from './counter';
import { DefaultLogger } from './default-logger';
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
  Counter,
];
