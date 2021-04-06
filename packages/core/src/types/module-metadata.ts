import { InjectionToken } from '@ts-stack/di';

import { ProvidersMetadata } from '../models/providers-metadata';
import { ControllerType } from '../types/mix';
import { ModuleType } from '../types/mix';
import { ModuleWithParams } from '../types/mix';
import { ServiceProvider } from '../types/service-provider';

export interface ModuleMetadata extends Partial<ProvidersMetadata> {
  /**
   * The module ID.
   */
  id?: string;
  /**
   * List of modules or `ModuleWithOptions` imported by this module.
   * Also you can imports modules and set some prefix per each the module.
   */
  imports?: Array<ModuleType | ModuleWithParams>;
  /**
   * List of modules, `ModuleWithOptions` or providers exported by this
   * module.
   */
  exports?: Array<ModuleType | ServiceProvider>;
  /**
   * The application controllers.
   */
  controllers?: ControllerType[];
  /**
   * The application extensions.
   */
  extensions?: InjectionToken<any>[];
}
