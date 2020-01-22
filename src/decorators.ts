import { ListenOptions } from 'net';
import { makeDecorator, TypeProvider, makePropDecorator, Provider } from 'ts-di';

import { HttpServerModule, HttpsServerModule, Http2ServerModule, ServerOptions, HttpMethod, ObjectAny } from './types';

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

export const Controller = makeDecorator('Controller', (data: any) => data) as ControllersDecoratorFactory;

export type RouteDecoratorFactory = (method: HttpMethod, path?: string) => RouteDecorator;

export type RouteDecorator = <T>(
  target: ObjectAny,
  propertyName: string,
  descriptor: TypedPropertyDescriptor<T>
) => RouteDecoratorMetadata;

export interface RouteDecoratorMetadata {
  [key: string]: RouteMetadata[];
}

export interface RouteMetadata {
  method: HttpMethod;
  path: string;
}

function route(method: HttpMethod, path: string = ''): RouteMetadata {
  return { method, path };
}

export const Route = makePropDecorator('Route', route) as RouteDecoratorFactory;
