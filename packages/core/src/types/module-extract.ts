import type { AppOptions } from './app-options.js';
import type { ModuleWithParams1, ModuleWithParams2 } from './module-metadata.js';

/**
 * Extraction from current module.
 */
export class ModuleExtract {
  /**
   * Specifies whether the module is an external module or not. An external module
   * is a module that you install using package managers (npm, yarn, etc.).
   */
  isExternal?: boolean;
  /**
   * Module name.
   */
  moduleName: string = '';
  /**
   * Module prefix without prefix per the application (see {@link AppOptions.path}). This prefix will be equal
   * to `absolutePath` if the module was imported specifying {@link ModuleWithParams2.absolutePath | ModuleWithParams.absolutePath}.
   * If the module was imported with the {@link ModuleWithParams1.path | ModuleWithParams.path} property, and it is a nested module,
   * then path will include prefixes from all parent paths.
   */
  path?: string = '';
}
