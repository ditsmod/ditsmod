import { Injector, ReflectiveInjector } from '@ts-stack/di';

import { BodyParserConfig } from '../models/body-parser-config';
import { RootMetadata } from '../models/root-metadata';
import { Logger, LoggerConfig } from '../types/logger';
import { ROUTES_EXTENSIONS } from '../types/routes-extensions';
import { ServiceProvider } from '../types/service-provider';
import { DefaultLogger } from './default-logger';
import { ExtensionsManager } from './extensions-manager';
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
  RootMetadata,
  ExtensionsManager,
  { provide: ROUTES_EXTENSIONS, useClass: PreRoutes, multi: true },
  ModuleManager,
  PreRouter,
];
