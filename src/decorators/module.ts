import { Type, Provider, makeDecorator, TypeProvider } from 'ts-di';

import { ModuleWithProviders } from '../types/types';
import { RouteConfig } from '../types/router';
import { BodyParser } from '../services/body-parser';
import { EntityManager } from '../services/entity-manager';
import { Request } from '../request';
import { Response } from '../response';

export const defaultProvidersPerReq: Provider[] = [Request, Response, BodyParser, EntityManager];

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
  /**
   * Providers per the `Application`.
   */
  providersPerApp: Provider[] = [];
}

export class ModuleMetadata extends AbstractModuleMetadata {
  imports: Type<any>[] = [];
  exports: (Type<any> | Provider)[] = [];
}
