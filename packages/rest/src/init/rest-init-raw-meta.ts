import type {
  AnyObj,
  ModuleType,
  Class,
  AnyFn,
  InitDecoratorOptions,
  DynamicModuleOptions,
  ForwardRefFn,
} from '@ditsmod/core';
import type { GuardItem } from '#interceptors/guard.js';

/**
 * Metadata for the `initRest` decorator, which adds REST metadata to a `featureModule` or `rootModule`.
 */
export interface RestInitDecoratorOptions extends InitDecoratorOptions<RestModuleOptions> {
  /**
   * List of modules that contain controllers. Providers from these modules
   * are not imported into the current module. If the current module has a prefix path,
   * that path will be added to each controller route from the appended modules.
   */
  appends?: Array<ModuleType | AppendsWithOptions | ForwardRefFn<ModuleType>>;
  /**
   * The application controllers.
   */
  controllers?: Class[];
}

export type RestModuleOptions = RestModuleOptions1 | RestModuleOptions2;

export interface BaseRestModuleOptions extends DynamicModuleOptions {
  /**
   * List of modules, `RestModuleOptions` or tokens of providers exported by this
   * module.
   */
  exports?: any[];
  guards?: GuardItem[];
}

export interface RestModuleOptions1 extends BaseRestModuleOptions {
  path?: string;
  absolutePath?: never;
}

export interface RestModuleOptions2 extends BaseRestModuleOptions {
  absolutePath?: string;
  path?: never;
}
/**
 * Used for module metadata, for `appends` array.
 */
export type AppendsWithOptions<T extends AnyObj = AnyObj> = AppendsWithOptions1<T> | AppendsWithOptions2<T>;

export interface BaseAppendsWithOptions<T extends AnyObj = AnyObj> {
  /**
   * The module ID.
   */
  id?: string;
  module: ModuleType<T> | ForwardRefFn<ModuleType<T>>;
  guards?: GuardItem[];
  initParams?: Map<AnyFn, any>;
}

export interface AppendsWithOptions1<T extends AnyObj = AnyObj> extends BaseAppendsWithOptions<T> {
  path?: string;
  absolutePath?: never;
}

export interface AppendsWithOptions2<T extends AnyObj = AnyObj> extends BaseAppendsWithOptions<T> {
  absolutePath?: string;
  path?: never;
}
