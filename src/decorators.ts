import { ListenOptions } from 'net';
import { makeDecorator, TypeProvider, makePropDecorator, Provider, Type } from 'ts-di';

import { ServerOptions, HttpMethod, ObjectAny, ModuleWithProviders, HttpModule } from './types';

export interface ModuleDecoratorFactory {
  (data?: ModuleDecorator): any;
  new (data?: ModuleDecorator): ModuleDecorator;
}

export interface ModuleDecorator {
  /**
   * List of modules or `ModuleWithProviders` imported by this module.
   */
  imports?: Array<Type<any> | ModuleWithProviders<{}> | any[]>;
  /**
   * List of modules, `ModuleWithProviders` or providers exported by this
   * module.
   */
  exports?: Array<Type<any> | ModuleWithProviders<{}> | Provider | any[]>;
  /**
   * Providers per a module.
   */
  providersPerMod?: Provider[];
  /**
   * Providers per the request.
   */
  providersPerReq?: Provider[];
  /**
   * The application controllers.
   */
  controllers?: TypeProvider[];
}

export const Module = makeDecorator('Module', (data: any) => data) as ModuleDecoratorFactory;

export interface RootModuleDecoratorFactory {
  (data?: RootModuleDecorator): any;
  new (data?: RootModuleDecorator): RootModuleDecorator;
}

export interface RootModuleDecorator extends ModuleDecorator {
  exports?: never;
  serverName?: string;
  httpModule?: HttpModule;
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
  httpMethod: HttpMethod;
  path: string;
}

function route(httpMethod: HttpMethod, path: string = ''): RouteMetadata {
  return { httpMethod, path };
}

export const Route = makePropDecorator('Route', route) as RouteDecoratorFactory;
