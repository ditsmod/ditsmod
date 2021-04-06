import { Injector, ReflectiveInjector } from '@ts-stack/di';

import { BodyParserConfig } from '../models/body-parser-config';
import { RootMetadata } from '../models/root-metadata';
import { DEFAULT_EXTENSIONS, ROUTES_EXTENSIONS } from '../types/extension';
import { Logger, LoggerConfig } from '../types/logger';
import { ServiceProvider } from '../types/mix';
import { Counter } from './counter';
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
  PreRouter,
  Counter,
  { provide: DEFAULT_EXTENSIONS, useClass: PreRouter, multi: true },
  { provide: ROUTES_EXTENSIONS, useClass: PreRoutes, multi: true },
  ModuleManager
];
