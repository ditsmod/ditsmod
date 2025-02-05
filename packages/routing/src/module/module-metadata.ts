import { AnyObj, ProvidersMetadata, ModuleType, Class, Provider, Providers } from '@ditsmod/core';
import { GuardItem } from '#interceptors/guard.js';

export interface RoutingMetadata {
  /**
   * List of modules, `RoutingModuleParams` or tokens of providers exported by this
   * module.
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
  resolvedCollisionsPerRou?: [any, ModuleType | RoutingModuleParams][];
  /**
   * An array of pairs, each of which is in the first place the provider's token,
   * and in the second - the module from which to import the provider with the specified token.
   */
  resolvedCollisionsPerReq?: [any, ModuleType | RoutingModuleParams][];
  /**
   * List of modules that contain controllers. Providers and extensions from these modules
   * are not imported into the current module. If the current module has a prefix path,
   * that path will be added to each controller route from the appended modules.
   */
  appends?: Array<ModuleType | AppendsWithParams>;
  /**
   * The application controllers.
   */
  controllers?: Class[];
}

export type RoutingModuleParams<M extends AnyObj = AnyObj, E extends AnyObj = AnyObj> =
  | RoutingModuleParams1<M, E>
  | RoutingModuleParams2<M, E>;

export interface BaseModuleWithParams<M extends AnyObj = AnyObj, E extends AnyObj = AnyObj>
  extends Partial<ProvidersMetadata> {
  id?: string;
  module: ModuleType<M>;
  /**
   * List of modules, `RoutingModuleParams` or tokens of providers exported by this
   * module.
   */
  exports?: any[];
  guards?: GuardItem[];
  /**
   * This property allows you to pass any information to extensions.
   *
   * You must follow this rule: data for one extension - one key in `extensionsMeta` object.
   */
  extensionsMeta?: E;
}

export interface RoutingModuleParams1<M extends AnyObj = AnyObj, E extends AnyObj = AnyObj>
  extends BaseModuleWithParams<M, E> {
  path?: string;
  absolutePath?: never;
}

export interface RoutingModuleParams2<M extends AnyObj = AnyObj, E extends AnyObj = AnyObj>
  extends BaseModuleWithParams<M, E> {
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
