import type { ProvidersByLevel } from '#types/providers-metadata.js';
import type { AnyObj, ModRefId, ModuleType } from '#types/mix.js';
import type { ExtensionConfig } from '#extension/extension-providers-and-configs.js';
import type { ExtensionClass } from '#extension/extension-types.js';
import type { InitDynamicOptionsMap } from '#decorators/init-hooks-and-metadata.js';
import type { rootModule } from '#decorators/root-module.js';
import type { featureModule } from '#decorators/feature-module.js';
import type { ProviderBuilder } from '#utils/providers.js';
import type { Provider } from '#di/top/types-and-models.js';
import type { ForwardRefFn } from '#di/forward-ref.js';

/**
 * Raw metadata that is passed to the {@link rootModule} and {@link featureModule} decorators.
 */
export class ModuleDecoratorOptions<T extends AnyObj = AnyObj> {
  /**
   * Providers per the application.
   */
  declare providersPerApp?: ProviderBuilder | (Provider | ForwardRefFn<Provider>)[];
  /**
   * Providers per a module.
   */
  declare providersPerMod?: ProviderBuilder | (Provider | ForwardRefFn<Provider>)[];
  /**
   * Providers per a route.
   */
  declare providersPerRou?: ProviderBuilder | (Provider | ForwardRefFn<Provider>)[];
  /**
   * Providers per a request.
   */
  declare providersPerReq?: ProviderBuilder | (Provider | ForwardRefFn<Provider>)[];
  /**
   * List of modules or `DynamicModule` imported by this module.
   * Also you can imports modules and set some prefix per each the module.
   */
  declare imports?: (ModRefId | ForwardRefFn<ModuleType>)[];
  /**
   * List of modules, {@link DynamicModule} or tokens of providers exported by this
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
  declare resolvedCollisionsPerMod?: [any, ModRefId | ForwardRefFn<ModuleType>][];
  /**
   * An array of pairs, each of which is in the first place the provider's token,
   * and in the second - the module from which to import the provider with the specified token.
   */
  declare resolvedCollisionsPerRou?: [any, ModRefId | ForwardRefFn<ModuleType>][];
  /**
   * An array of pairs, each of which is in the first place the provider's token,
   * and in the second - the module from which to import the provider with the specified token.
   */
  declare resolvedCollisionsPerReq?: [any, ModRefId | ForwardRefFn<ModuleType>][];
  /**
   * Whether this module inherits init hooks / context (like REST or tRPC) from parent modules.
   * By default, it is true for local modules and false for external modules.
   */
  declare inheritsContext?: boolean;
}

export interface BaseDynamicModule<M extends AnyObj = AnyObj> {
  /**
   * The module ID.
   */
  id?: string;
  module: ModuleType<M> | ForwardRefFn<ModuleType<M>>;
}
export interface DynamicModuleOptions<E extends AnyObj = AnyObj> extends Partial<ProvidersByLevel> {
  /**
   * List of modules, `DynamicModule` or tokens of providers exported by this
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
export interface DynamicModule<M extends AnyObj = AnyObj> extends BaseDynamicModule<M>, DynamicModuleOptions {
  /**
   * If the current module has this property populated, this means it was used in the context of init decorators.
   */
  initOpts?: InitDynamicOptionsMap;
}
/**
 * This interface differs from `DynamicModule` only in that it requires the presence of the `initOpts` property.
 * It is convenient to use in static module methods that return `DynamicModule`.
 */
export interface DynamicModuleWithInit<M extends AnyObj = AnyObj> extends DynamicModule<M> {
  initOpts: InitDynamicOptionsMap;
}
