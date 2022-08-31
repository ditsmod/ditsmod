import { ProvidersMetadata } from '../models/providers-metadata';
import { ControllerType, ModuleType, ModuleWithParams, AnyObj } from '../types/mix';
import { ExtensionOptions } from '../utils/get-extension-provider';

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
   * List of modules, `ModuleWithParams` or tokens of providers exported by this
   * module.
   */
  exports?: any[];
  /**
   * The application controllers.
   */
  controllers?: ControllerType[];
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
