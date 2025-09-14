import { AnyObj, ModuleType, Class, AnyFn, BaseInitRawMeta, FeatureModuleParams, ForwardRefFn } from '@ditsmod/core';
import { GuardItem } from '#interceptors/guard.js';

/**
 * Metadata for the `initRest` decorator, which adds REST metadata to a `featureModule` or `rootModule`.
 */
export interface RestInitRawMeta extends BaseInitRawMeta<RestModuleParams> {
  /**
   * List of modules that contain controllers. Providers from these modules
   * are not imported into the current module. If the current module has a prefix path,
   * that path will be added to each controller route from the appended modules.
   */
  appends?: Array<ModuleType | AppendsWithParams | ForwardRefFn<ModuleType>>;
  /**
   * The application controllers.
   */
  controllers?: Class[];
}

export type RestModuleParams = RestModuleParams1 | RestModuleParams2;

export interface BaseRestModuleParams extends FeatureModuleParams {
  /**
   * List of modules, `RestModuleParams` or tokens of providers exported by this
   * module.
   */
  exports?: any[];
  guards?: GuardItem[];
}

export interface RestModuleParams1 extends BaseRestModuleParams {
  path?: string;
  absolutePath?: never;
}

export interface RestModuleParams2 extends BaseRestModuleParams {
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
  module: ModuleType<T> | ForwardRefFn<ModuleType<T>>;
  guards?: GuardItem[];
  initParams?: Map<AnyFn, any>;
}

export interface AppendsWithParams1<T extends AnyObj = AnyObj> extends BaseAppendsWithParams<T> {
  path?: string;
  absolutePath?: never;
}

export interface AppendsWithParams2<T extends AnyObj = AnyObj> extends BaseAppendsWithParams<T> {
  absolutePath?: string;
  path?: never;
}
