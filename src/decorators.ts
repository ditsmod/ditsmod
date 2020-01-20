import * as http from 'http';
import * as https from 'https';
import * as http2 from 'http2';
import { ListenOptions } from 'net';
import { makeDecorator, TypeProvider, makePropDecorator, Provider } from 'ts-di';

import {
  HttpMethod as HttpMethods,
  HttpServerModule,
  HttpsServerModule,
  Http2ServerModule,
  ServerOptions,
  RouteDecoratorProps
} from './types';

export interface ModuleDecoratorFactory {
  (data?: ModuleDecorator): any;
  new (data?: ModuleDecorator): ModuleDecorator;
}

export interface ModuleDecorator {
  /**
   * The application controllers.
   */
  controllers?: TypeProvider[];
  /**
   * Providers per a module.
   */
  providersPerMod?: Provider[];
  /**
   * Providers per the `Request`.
   */
  providersPerReq?: Provider[];
}

export const Module = makeDecorator('Module', (data: any) => data) as ModuleDecoratorFactory;

export interface RootModuleDecoratorFactory {
  (data?: RootModuleDecorator): any;
  new (data?: RootModuleDecorator): RootModuleDecorator;
}

export interface RootModuleDecorator extends ModuleDecorator {
  serverName?: string;
  serverModule?: HttpServerModule | HttpsServerModule | Http2ServerModule;
  serverOptions?: ServerOptions;
  listenOptions?: ListenOptions;
  /**
   * Providers per the `Application`.
   */
  providersPerApp?: Provider[];
}

export const RootModule = makeDecorator('RootModule', (data: any) => data) as RootModuleDecoratorFactory;

export interface ControllersDecoratorFactory {
  (data: ControllersDecorator): any;
  new (data: ControllersDecorator): ControllersDecorator;
}

export interface ControllersDecorator {
  path: string;
}

export const Controller = makeDecorator('Controllers', (data: any) => data) as ControllersDecoratorFactory;

type ControllerPropDecorator = (method: HttpMethods, path?: string) => any;

function route(method: HttpMethods, path: string = ''): RouteDecoratorProps {
  return { method, path };
}

export const Route: ControllerPropDecorator = makePropDecorator('Route', route);
