import * as http from 'http';
import { ListenOptions } from 'net';
import { Provider, forwardRef, ReflectiveInjector, Injector } from 'ts-di';
import { Router as RestifyRouter } from '@restify-ts/router';

import { HttpModule, Logger, ServerOptions, BodyParserConfig } from './types';
import { PreRequest } from '../services/pre-request';
import { ModuleFactory } from '../module-factory';
import { Request } from '../request';
import { Response } from '../response';
import { BodyParser } from '../services/body-parser';
import { EntityManager } from '../services/entity-manager';
import { EntityInjector } from '../decorators/entity';
import { Router, RoutesPrefixPerMod } from './router';

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
