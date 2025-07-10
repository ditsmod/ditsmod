import { AnyObj, ModuleType, Class, Provider, Providers, ModuleWithParams, ModRefId } from '@ditsmod/core';

import { GuardItem } from '#interceptors/guard.js';
import { RestProvidersMetadata } from '#init/rest-normalized-meta.js';

/**
 * Metadata for the `addRest` decorator, which adds REST metadata to a `featureModule` or `rootModule`.
 */
export interface AddRest {
  /**
   * List of provider tokens exported by this module.
   */
  exports?: any[];
  /**
   * Providers per route.
   */
  providersPerRou?: Providers | Provider[];
  /**
   * Providers per HTTP request.
   */
  providersPerReq?: Providers | Provider[];
  /**
   * An array of pairs, each of which is in the first place the provider's token,
   * and in the second - the module from which to import the provider with the specified token.
   */
  resolvedCollisionsPerRou?: [any, ModuleType | ModuleWithParams][];
  /**
   * An array of pairs, each of which is in the first place the provider's token,
   * and in the second - the module from which to import the provider with the specified token.
   */
  resolvedCollisionsPerReq?: [any, ModuleType | ModuleWithParams][];
  /**
   * List of modules that contain controllers. Providers from these modules
   * are not imported into the current module. If the current module has a prefix path,
   * that path will be added to each controller route from the appended modules.
   */
  appends?: Array<ModuleType | AppendsWithParams>;
  /**
   * The application controllers.
   */
  controllers?: Class[];
  importsWithParams?: ({ modRefId: ModRefId } & RestModuleParams)[];
}

export type RestModuleParams = RestModuleParams1 | RestModuleParams2;

export interface BaseModuleParams extends Partial<RestProvidersMetadata> {
  /**
   * List of modules, `RestModuleParams` or tokens of providers exported by this
   * module.
   */
  exports?: any[];
  guards?: GuardItem[];
}

export interface RestModuleParams1 extends BaseModuleParams {
  path?: string;
  absolutePath?: never;
}

export interface RestModuleParams2 extends BaseModuleParams {
  absolutePath?: string;
  path?: never;
}
/**
 * Used for module metadata, for `appends` array.
 */
export type AppendsWithParams<T extends AnyObj = AnyObj> = AppendsWithParams1<T> | AppendsWithParams2<T>;

export interface BaseAppendsWithParams<T extends AnyObj = AnyObj> {
  /**
   * The module ID.
   */
  id?: string;
  module: ModuleType<T>;
  guards?: GuardItem[];
}

export interface AppendsWithParams1<T extends AnyObj = AnyObj> extends BaseAppendsWithParams<T> {
  path: string;
  absolutePath?: never;
}

export interface AppendsWithParams2<T extends AnyObj = AnyObj> extends BaseAppendsWithParams<T> {
  absolutePath: string;
  path?: never;
}
