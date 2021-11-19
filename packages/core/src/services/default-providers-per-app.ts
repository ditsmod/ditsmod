import { Injector, ReflectiveInjector } from '@ts-stack/di';

import { BodyParserConfig } from '../models/body-parser-config';
import { RootMetadata } from '../models/root-metadata';
import { PRE_ROUTER_EXTENSIONS, ROUTES_EXTENSIONS } from '../constans';
import { Logger, LoggerConfig } from '../types/logger';
import { ServiceProvider } from '../types/mix';
import { Counter } from './counter';
import { DefaultLogger } from './default-logger';
import { ExtensionsManager } from './extensions-manager';
import { ModuleManager } from './module-manager';
import { PreRouterExtension } from '../extensions/pre-router.extension';
import { RoutesExtension } from '../extensions/routes.extension';
import { Log, LogConfig } from './log';

export const defaultProvidersPerApp: Readonly<ServiceProvider[]> = [
  LoggerConfig,
  { provide: Logger, useClass: DefaultLogger },
  BodyParserConfig,
  {
    provide: ReflectiveInjector,
    useExisting: Injector,
  },
  RootMetadata,
  ExtensionsManager,
  PreRouterExtension,
  Counter,
  { provide: PRE_ROUTER_EXTENSIONS, useExisting: PreRouterExtension, multi: true },
  { provide: ROUTES_EXTENSIONS, useClass: RoutesExtension, multi: true },
  ModuleManager,
  Log,
  LogConfig,
];
