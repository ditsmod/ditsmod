import * as http from 'http';
import { ListenOptions } from 'net';
import { Type, Provider, TypeProvider, forwardRef, ReflectiveInjector, Injector } from 'ts-di';
import { Router as RestifyRouter } from '@restify-ts/router';

import { HttpModule, Logger, Router, ServerOptions, BodyParserConfig, RouteConfig } from './types';
import { PreRequest } from '../services/pre-request';
import { ModuleFactory } from '../module-factory';
import { Request } from '../request';
import { Response } from '../response';
import { BodyParser } from '../services/body-parser';

export const defaultProvidersPerApp: Provider[] = [
  Logger,
  BodyParserConfig,
  { provide: Router, useClass: RestifyRouter },
  forwardRef(() => ModuleFactory),
  PreRequest,
  {
    provide: ReflectiveInjector,
    useExisting: Injector
  }
];

export const defaultProvidersPerReq: Provider[] = [Request, Response, BodyParser];

export class ModuleMetadata {
  moduleName: string;
  imports: Type<any>[] = [];
  exports: (Type<any> | Provider)[] = [];
  providersPerMod: Provider[] = [];
  providersPerReq: Provider[] = defaultProvidersPerReq;
  controllers: TypeProvider[] = [];
  routesPrefixPerMod?: string = '';
  routesPerMod?: RouteConfig[] = [];
}

export class ApplicationMetadata {
  serverName?: string = 'Node.js';
  httpModule?: HttpModule = http;
  serverOptions?: ServerOptions = {};
  listenOptions?: ListenOptions = { host: 'localhost', port: 8080 };
  providersPerApp?: Provider[] = defaultProvidersPerApp;
  routesPrefixPerApp?: string = '';
  routesPerApp?: RouteConfig[] = [];
}
