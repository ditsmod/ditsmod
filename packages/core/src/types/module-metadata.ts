import { Class } from '#di';
import { ProvidersMetadata } from '#types/providers-metadata.js';
import { AnyObj, GuardItem, ModuleType, ModuleWithParams } from '#types/mix.js';
import { ExtensionOptions } from '#utils/get-extension-provider.js';

/**
 * Used for module metadata, for `appends` array.
 */
export interface AppendsWithParams<T extends AnyObj = AnyObj> {
  /**
   * The module ID.
   */
  id?: string;
  path: string;
  module: ModuleType<T>;
  guards?: GuardItem[];
}

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
   * are not imported into the current module. If the current module has a prefix,
   * that prefix will be added to each controller route from the appended modules.
   */
  appends?: Array<ModuleType | AppendsWithParams>;
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
  extensions?: ExtensionOptions[];
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
