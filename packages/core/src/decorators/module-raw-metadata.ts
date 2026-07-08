import type { ProvidersOnly } from '#types/providers-metadata.js';
import type { AnyObj, ModRefId, ModuleType } from '#types/mix.js';
import type { ExtensionConfig } from '#extension/extension-providers-and-configs.js';
import type { ExtensionClass } from '#extension/extension-types.js';
import type { InitParamsMap } from '#decorators/init-hooks-and-metadata.js';
import type { rootModule } from '#decorators/root-module.js';
import type { featureModule } from '#decorators/feature-module.js';
import type { Providers } from '#utils/providers.js';
import type { Provider } from '#di/top/types-and-models.js';
import type { ForwardRefFn } from '#di/forward-ref.js';

/**
 * Raw metadata that is passed to the {@link rootModule} and {@link featureModule} decorators.
 */
export class ModuleRawMetadata<T extends AnyObj = AnyObj> {
  /**
   * Providers per the application.
   */
  declare providersPerApp?: Providers | (Provider | ForwardRefFn<Provider>)[];
  /**
   * Providers per a module.
   */
  declare providersPerMod?: Providers | (Provider | ForwardRefFn<Provider>)[];
  /**
   * Providers per a route.
   */
  declare providersPerRou?: Providers | (Provider | ForwardRefFn<Provider>)[];
  /**
   * Providers per a request.
   */
  declare providersPerReq?: Providers | (Provider | ForwardRefFn<Provider>)[];
  /**
   * List of modules or `ModuleWithParams` imported by this module.
   * Also you can imports modules and set some prefix per each the module.
   */
  declare imports?: (ModRefId | ForwardRefFn<ModuleType>)[];
  /**
   * List of modules, {@link ModuleWithParams} or tokens of providers exported by this
   * module.
   */
  declare exports?: any[];
  /**
   * The application extensions.
   */
  declare extensions?: (ExtensionConfig | ExtensionClass)[];
  /**
   * This property allows you to pass any information to extensions.
   *
   * You must follow this rule: data for one extension - one key in `extensionsMeta` object.
   */
  declare extensionsMeta?: T;
  /**
   * An array of pairs, each of which is in the first place the provider's token,
   * and in the second - the module from which to import the provider with the specified token.
   */
  declare resolvedCollisionPerMod?: [any, ModRefId | ForwardRefFn<ModuleType>][];
  /**
   * An array of pairs, each of which is in the first place the provider's token,
   * and in the second - the module from which to import the provider with the specified token.
   */
  declare resolvedCollisionPerRou?: [any, ModRefId | ForwardRefFn<ModuleType>][];
  /**
   * An array of pairs, each of which is in the first place the provider's token,
   * and in the second - the module from which to import the provider with the specified token.
   */
  declare resolvedCollisionPerReq?: [any, ModRefId | ForwardRefFn<ModuleType>][];
}

export interface BaseModuleWithParams<M extends AnyObj = AnyObj> {
  /**
   * The module ID.
   */
  id?: string;
  module: ModuleType<M> | ForwardRefFn<ModuleType<M>>;
}
/**
 * Metadata with this type is created when the `parentMeta: BaseMeta` property is added to `BaseModuleWithParams`.
 */
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
