import { ProvidersMetadata } from '#types/providers-metadata.js';
import { AnyObj, ModuleType } from '#types/mix.js';
import { ExtensionConfig } from '#extension/get-extension-provider.js';
import { ExtensionClass } from '#extension/extension-types.js';

export interface ModuleMetadata<T extends AnyObj = AnyObj> extends Partial<ProvidersMetadata> {
  /**
   * The module ID.
   */
  id?: string;
  /**
   * List of modules or `ModuleWithParams` imported by this module.
   * Also you can imports modules and set some prefix per each the module.
   */
  imports?: Array<ModuleType | FeatureModuleWithParams>;
  /**
   * List of modules, `ModuleWithParams` or tokens of providers exported by this
   * module.
   */
  exports?: any[];
  /**
   * The application extensions.
   */
  extensions?: (ExtensionConfig | ExtensionClass)[];
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
  resolvedCollisionsPerMod?: [any, ModuleType | FeatureModuleWithParams][];
}
export type FeatureModuleWithParams = ModuleWithParams & FeatureModuleParams;

export interface ModuleWithParams<M extends AnyObj = AnyObj> {
  id?: string;
  module: ModuleType<M>;
}
export interface FeatureModuleParams<E extends AnyObj = AnyObj> extends Partial<ProvidersMetadata> {
  /**
   * List of modules, `ModuleWithParams` or tokens of providers exported by this
   * module.
   */
  exports?: any[];
  /**
   * This property allows you to pass any information to extensions.
   *
   * You must follow this rule: data for one extension - one key in `extensionsMeta` object.
   */
  extensionsMeta?: E;
}
