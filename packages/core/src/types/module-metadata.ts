import { InjectionToken } from '@ts-stack/di';

import { ProvidersMetadata } from '../models/providers-metadata';
import { ControllerType, ModuleType, ModuleWithParams, ServiceProvider, Extension, AnyObj } from '../types/mix';

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
   * List of modules, `ModuleWithParams` or providers exported by this
   * module.
   */
  exports?: Array<ModuleType | ModuleWithParams | ServiceProvider>;
  /**
   * The application controllers.
   */
  controllers?: ControllerType[];
  /**
   * The application extensions.
   */
  extensions?: InjectionToken<Extension<any>[]>[];
  /**
   * This property allows you to pass any information to extensions.
   * 
   * You must follow this rule: data for one extension - one key in `extensionsMeta` object.
   */
  extensionsMeta?: T;
}
