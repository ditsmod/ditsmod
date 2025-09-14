import { ProvidersOnly } from '#types/providers-metadata.js';
import { AnyObj, ModRefId, ModuleType } from '#types/mix.js';
import { ExtensionConfig } from '#extension/get-extension-provider.js';
import { ExtensionClass } from '#extension/extension-types.js';
import { InitParamsMap } from '#decorators/init-hooks-and-metadata.js';
import type { rootModule } from '#decorators/root-module.js';
import type { featureModule } from '#decorators/feature-module.js';
import { ForwardRefFn } from '#di';

/**
 * Raw metadata for {@link rootModule} and {@link featureModule} decorator.
 */
export interface ModuleMetadata<T extends AnyObj = AnyObj> extends Partial<ProvidersOnly> {
  /**
   * List of modules or `ModuleWithParams` imported by this module.
   * Also you can imports modules and set some prefix per each the module.
   */
  imports?: (ModRefId | ForwardRefFn<ModuleType>)[];
  /**
   * List of modules, {@link ModuleWithParams} or tokens of providers exported by this
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
  resolvedCollisionsPerMod?: [any, ModRefId | ForwardRefFn<ModuleType>][];
  /**
   * An array of pairs, each of which is in the first place the provider's token,
   * and in the second - the module from which to import the provider with the specified token.
   */
  resolvedCollisionsPerRou?: [any, ModRefId | ForwardRefFn<ModuleType>][];
  /**
   * An array of pairs, each of which is in the first place the provider's token,
   * and in the second - the module from which to import the provider with the specified token.
   */
  resolvedCollisionsPerReq?: [any, ModRefId | ForwardRefFn<ModuleType>][];
}
/**
 * An object with this type is passed into the `imports` array of
 * the module with the `featureModule` or `rootModule` decorator.
 */
export interface ModuleWithParams<M extends AnyObj = AnyObj> extends BaseModuleWithParams<M>, FeatureModuleParams {
  /**
   * If the current module has this property populated, this means it was used in the context of init decorators.
   */
  initParams?: InitParamsMap;
}
/**
 * This interface differs from `ModuleWithParams` only in that it requires the presence of the `initParams` property.
 * It is convenient to use in static module methods that return `ModuleWithParams`.
 */
export interface ModuleWithInitParams<M extends AnyObj = AnyObj> extends ModuleWithParams<M> {
  initParams: InitParamsMap;
}
/**
 * Metadata with this type is created when the `parentMeta: BaseMeta` property is added to `BaseModuleWithParams`.
 */

export interface BaseModuleWithParams<M extends AnyObj = AnyObj> {
  /**
   * The module ID.
   */
  id?: string;
  module: ModuleType<M> | ForwardRefFn<ModuleType<M>>;
}
export interface FeatureModuleParams<E extends AnyObj = AnyObj> extends Partial<ProvidersOnly> {
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
