import { Type } from '@ts-stack/di';

import { ProvidersMetadata } from '../models/providers-metadata';
import { ControllerType } from '../types/controller-type';
import { Extension } from '../types/extension';
import { ModuleType } from '../types/module-type';
import { ModuleWithParams } from '../types/module-with-params';
import { ServiceProvider } from '../types/service-provider';

export interface ModuleMetadata extends Partial<ProvidersMetadata> {
  /**
   * List of modules or `ModuleWithOptions` imported by this module.
   * Also you can imports modules and set some prefix per each the module.
   */
  imports?: Array<ModuleType | ModuleWithParams<any>>;
  /**
   * List of modules, `ModuleWithOptions` or providers exported by this
   * module.
   */
  exports?: Array<ModuleType | ModuleWithParams<any> | ServiceProvider>;
  /**
   * The application controllers.
   */
  controllers?: ControllerType[];
  /**
   * The application extensions.
   */
  extensions?: Type<Extension>[];
}