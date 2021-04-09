import { Injector, ReflectiveInjector } from '@ts-stack/di';

import { BodyParserConfig } from '../models/body-parser-config';
import { RootMetadata } from '../models/root-metadata';
import { VOID_EXTENSIONS, ROUTES_EXTENSIONS } from '../types/extension';
import { Logger, LoggerConfig } from '../types/logger';
import { ServiceProvider } from '../types/mix';
import { Counter } from './counter';
import { DefaultLogger } from './default-logger';
import { ExtensionsManager } from './extensions-manager';
import { ModuleManager } from './module-manager';
import { PreRouter } from '../extensions/pre-router';
import { RoutesExtension } from '../extensions/routes.extension';

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
  { provide: VOID_EXTENSIONS, useExisting: PreRouter, multi: true },
  { provide: ROUTES_EXTENSIONS, useClass: RoutesExtension, multi: true },
  ModuleManager
];
