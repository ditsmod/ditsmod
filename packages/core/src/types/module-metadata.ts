import { ProvidersMetadata } from '../models/providers-metadata';
import { ControllerType, ModuleType, ModuleWithParams, AnyObj, ExtensionsProvider } from '../types/mix';

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
  extensions?: ExtensionsProvider[];
  /**
   * This property allows you to pass any information to extensions.
   *
   * You must follow this rule: data for one extension - one key in `extensionsMeta` object.
   */
  extensionsMeta?: T;
  resolvedCollisionsPerApp?: [any, ModuleType | ModuleWithParams][];
  resolvedCollisionsPerMod?: [any, ModuleType | ModuleWithParams][];
  resolvedCollisionsPerRou?: [any, ModuleType | ModuleWithParams][];
  resolvedCollisionsPerReq?: [any, ModuleType | ModuleWithParams][];
}
