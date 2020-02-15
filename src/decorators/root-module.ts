import { makeDecorator, Provider, TypeProvider, Type } from 'ts-di';

import { ApplicationMetadata, defaultProvidersPerReq } from '../types/default-options';
import { ModuleDecorator } from './module';
import { RouteConfig } from '../types/router';

export interface RootModuleDecoratorFactory {
  (data?: RootModuleDecorator): any;
  new (data?: RootModuleDecorator): RootModuleDecorator;
}

export interface RootModuleDecorator extends ModuleDecorator, Partial<ApplicationMetadata> {
  exports?: never;
}

export const RootModule = makeDecorator('RootModule', (data: any) => data) as RootModuleDecoratorFactory;

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
