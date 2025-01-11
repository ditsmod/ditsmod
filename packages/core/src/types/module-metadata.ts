import { Class } from '#di';
import { ProvidersMetadata } from '#types/providers-metadata.js';
import { AnyObj, ModuleType } from '#types/mix.js';
import { ExtensionConfig } from '#extension/get-extension-provider.js';

export interface ModuleMetadata<T extends AnyObj = AnyObj> extends Partial<ProvidersMetadata> {
  /**
   * The module ID.
   */
  id?: string;
  /**
   * List of modules or `ModuleWithParams` imported by this module.
   * Also you can imports modules and set some prefix per each the module.
   */
  imports?: Array<ModuleType | ModuleWithParams>;
  /**
   * List of modules that contain controllers. Providers and extensions from these modules
   * are not imported into the current module. If the current module has a prefix path,
   * that path will be added to each controller route from the appended modules.
   */
  // appends?: Array<ModuleType | AppendsWithParams>;
  /**
   * List of modules, `ModuleWithParams` or tokens of providers exported by this
   * module.
   */
  exports?: any[];
  /**
   * The application controllers.
   */
  controllers?: Class[];
  /**
   * The application extensions.
   */
  extensions?: ExtensionConfig[];
  /**
   * This property allows you to pass any information to extensions.
   *
   * You must follow this rule: data for one extension - one key in `extensionsMeta` object.
   */
  extensionsMeta?: T;
  /**
   * An array of pairs, each of which is in the first place the provider's token,
   * and in the second - the module from which to import the provider with the specified token.
   */
  resolvedCollisionsPerMod?: [any, ModuleType | ModuleWithParams][];
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
}

export type ModuleWithParams<M extends AnyObj = AnyObj, E extends AnyObj = AnyObj> =
  | ModuleWithParams1<M, E>
  | ModuleWithParams2<M, E>;

export interface BaseModuleWithParams<M extends AnyObj = AnyObj, E extends AnyObj = AnyObj>
  extends Partial<ProvidersMetadata> {
  id?: string;
  module: ModuleType<M>;
  /**
   * List of modules, `ModuleWithParams` or tokens of providers exported by this
   * module.
   */
  exports?: any[];
  // guards?: GuardItem[];
  /**
   * This property allows you to pass any information to extensions.
   *
   * You must follow this rule: data for one extension - one key in `extensionsMeta` object.
   */
  extensionsMeta?: E;
}

export interface ModuleWithParams1<M extends AnyObj = AnyObj, E extends AnyObj = AnyObj>
  extends BaseModuleWithParams<M, E> {
  path?: string;
  absolutePath?: never;
}

export interface ModuleWithParams2<M extends AnyObj = AnyObj, E extends AnyObj = AnyObj>
  extends BaseModuleWithParams<M, E> {
  absolutePath?: string;
  path?: never;
}
