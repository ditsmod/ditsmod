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
}
