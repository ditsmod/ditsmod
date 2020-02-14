import * as http from 'http';
import { ListenOptions } from 'net';
import { Type, Provider, TypeProvider, forwardRef, ReflectiveInjector, Injector } from 'ts-di';
import { Router as RestifyRouter } from '@restify-ts/router';

import { HttpModule, Logger, Router, ServerOptions, BodyParserConfig, RouteConfig, RoutesPrefixPerMod } from './types';
import { PreRequest } from '../services/pre-request';
import { ModuleFactory } from '../module-factory';
import { Request } from '../request';
import { Response } from '../response';
import { BodyParser } from '../services/body-parser';
import { EntityManager } from '../services/entity-manager';
import { EntityInjector } from '../decorators/entity';

export const defaultProvidersPerApp: Provider[] = [
  Logger,
  BodyParserConfig,
  { provide: Router, useClass: RestifyRouter },
  forwardRef(() => ModuleFactory),
  PreRequest,
  {
    provide: ReflectiveInjector,
    useExisting: Injector
  },
  {
    provide: EntityInjector,
    useValue: null
  }
];

export const defaultProvidersPerReq: Provider[] = [Request, Response, BodyParser, EntityManager];

export abstract class AbstractModuleMetadata {
  /**
   * Providers per a module.
   */
  providersPerMod: Provider[] = [];
  /**
   * Providers per the request.
   */
  providersPerReq: Provider[] = defaultProvidersPerReq;
  /**
   * The application controllers.
   */
  controllers: TypeProvider[] = [];
  /**
   * Route config array per a module.
   */
  routesPerMod: RouteConfig[] = [];
}

export class ModuleMetadata extends AbstractModuleMetadata {
  imports: Type<any>[] = [];
  exports: (Type<any> | Provider)[] = [];
}

export class ApplicationMetadata {
  serverName: string = 'Node.js';
  httpModule: HttpModule = http;
  serverOptions: ServerOptions = {};
  listenOptions: ListenOptions = { host: 'localhost', port: 8080 };
  /**
   * Providers per the `Application`.
   */
  providersPerApp: Provider[] = defaultProvidersPerApp;
  routesPrefixPerApp: string = '';
  routesPrefixPerMod: RoutesPrefixPerMod[] = [];
  entities: Provider[] = [];
}
