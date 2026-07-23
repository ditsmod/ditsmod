import type {
  AnyObj,
  StaticModule,
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
  appends?: Array<StaticModule | AppendsWithOptions | ForwardRefFn<StaticModule>>;
  /**
   * The application controllers.
   */
  controllers?: Class[];
}

export type RestModuleOptions = PathRestModuleOptions | AbsolutePathRestModuleOptions;

export interface BaseRestModuleOptions extends DynamicModuleOptions {
  /**
   * List of modules, `RestModuleOptions` or tokens of providers exported by this
   * module.
   */
  exports?: any[];
  guards?: GuardItem[];
}

export interface PathRestModuleOptions extends BaseRestModuleOptions {
  path?: string;
  absolutePath?: never;
}

export interface AbsolutePathRestModuleOptions extends BaseRestModuleOptions {
  absolutePath?: string;
  path?: never;
}
/**
 * Used for module metadata, for `appends` array.
 */
export type AppendsWithOptions<T extends AnyObj = AnyObj> =
  | PathAppendsWithOptions<T>
  | AbsolutePathAppendsWithOptions<T>;

export interface BaseAppendsWithOptions<T extends AnyObj = AnyObj> {
  /**
   * The module ID.
   */
  id?: string;
  module: StaticModule<T> | ForwardRefFn<StaticModule<T>>;
  guards?: GuardItem[];
  initOpts?: Map<AnyFn, any>;
}

export interface PathAppendsWithOptions<T extends AnyObj = AnyObj> extends BaseAppendsWithOptions<T> {
  path?: string;
  absolutePath?: never;
}

export interface AbsolutePathAppendsWithOptions<T extends AnyObj = AnyObj> extends BaseAppendsWithOptions<T> {
  absolutePath?: string;
  path?: never;
}
