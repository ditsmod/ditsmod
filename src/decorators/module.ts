import { Type, Provider, makeDecorator, TypeProvider } from 'ts-di';

import { RouteConfig } from '../types/router';
import { BodyParser } from '../services/body-parser';
import { Request } from '../request';
import { Response } from '../response';

export const defaultProvidersPerReq: Provider[] = [Request, Response, BodyParser];

export interface ModuleDecoratorFactory {
  (data?: ModuleDecorator): any;
  new (data?: ModuleDecorator): ModuleDecorator;
}

export const Module = makeDecorator('Module', (data: any) => data) as ModuleDecoratorFactory;

export abstract class ProvidersMetadata {
  /**
   * Providers per a module.
   */
  providersPerMod: Provider[] = [];
  /**
   * Providers per the request.
   */
  providersPerReq: Provider[] = defaultProvidersPerReq;
}

export interface ModuleWithOptions<T> extends Partial<ProvidersMetadata> {
  module: Type<T>;
}

export abstract class StaticModuleMetadata extends ProvidersMetadata {
  /**
   * The application controllers.
   */
  controllers: TypeProvider[] = [];
  /**
   * Route config array per a module.
   */
  routesPerMod: RouteConfig[] = [];
}

export interface ModuleDecorator extends Partial<StaticModuleMetadata> {
  /**
   * List of modules or `ModuleWithProviders` imported by this module.
   */
  imports?: Array<Type<any> | ModuleWithOptions<any> | any[]>;
  /**
   * List of modules, `ModuleWithProviders` or providers exported by this
   * module.
   */
  exports?: Array<Type<any> | ModuleWithOptions<any> | Provider | any[]>;
}

export class ModuleMetadata extends StaticModuleMetadata {
  imports: Array<Type<any> | ModuleWithOptions<any>> = [];
  exports: Array<Type<any> | ModuleWithOptions<any> | Provider> = [];
}

export type ModuleType = new (...args: any[]) => any;
