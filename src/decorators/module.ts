import { Type, Provider, makeDecorator, TypeProvider } from 'ts-di';

import { ModuleWithProviders } from '../types/types';
import { defaultProvidersPerReq } from '../types/default-providers';
import { RouteConfig } from '../types/router';

export interface ModuleDecoratorFactory {
  (data?: ModuleDecorator): any;
  new (data?: ModuleDecorator): ModuleDecorator;
}

export interface ModuleDecorator extends Partial<AbstractModuleMetadata> {
  /**
   * List of modules or `ModuleWithProviders` imported by this module.
   */
  imports?: Array<Type<any> | ModuleWithProviders<{}> | any[]>;
  /**
   * List of modules, `ModuleWithProviders` or providers exported by this
   * module.
   */
  exports?: Array<Type<any> | ModuleWithProviders<{}> | Provider | any[]>;
}

export const Module = makeDecorator('Module', (data: any) => data) as ModuleDecoratorFactory;

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
