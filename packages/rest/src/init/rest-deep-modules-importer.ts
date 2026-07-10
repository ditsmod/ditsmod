import type {
  ModRefId,
  Provider,
  ModuleManager,
  SystemLogMediator,
  DeepModulesImporter,
  ShallowModuleImports,
} from '@ditsmod/core';

import type { DeepModulesImporterConfig, RestResolvedModuleMetadata, RestShallowModuleImports } from './types.js';

/**
 * By analyzing the dependencies of the providers returned by `ShallowModulesImporter`,
 * recursively collects providers for them from the corresponding modules.
 */
export class RestDeepModulesImporter {
  protected shallowModuleImports: RestShallowModuleImports;
  protected moduleManager: ModuleManager;
  protected shallowModuleImportsMap: Map<ModRefId, ShallowModuleImports>;
  protected providersPerApp: Provider[];
  protected log: SystemLogMediator;
  protected parent: DeepModulesImporter;

  constructor({
    parent,
    shallowModuleImports,
    moduleManager,
    shallowModuleImportsMap,
    providersPerApp,
    log,
  }: DeepModulesImporterConfig) {
    this.parent = parent;
    this.shallowModuleImports = shallowModuleImports;
    this.moduleManager = moduleManager;
    this.shallowModuleImportsMap = shallowModuleImportsMap;
    this.providersPerApp = providersPerApp;
    this.log = log;
  }

  importModulesDeep(): RestResolvedModuleMetadata | undefined {
    const { guards1, prefixPerMod, meta, applyControllers } = this.shallowModuleImports;
    return {
      normalizedModuleMeta: this.shallowModuleImports.normalizedModuleMeta,
      meta,
      guards1,
      prefixPerMod,
      applyControllers,
    };
  }
}
