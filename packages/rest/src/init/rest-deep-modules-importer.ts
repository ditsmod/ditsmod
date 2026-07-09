import type {
  ModRefId,
  Provider,
  ModuleManager,
  SystemLogMediator,
  DeepModulesImporter,
  ShallowImports,
} from '@ditsmod/core';

import type { DeepModulesImporterConfig, RestMetadataPerMod2, RestShallowImports } from './types.js';

/**
 * By analyzing the dependencies of the providers returned by `ShallowModulesImporter`,
 * recursively collects providers for them from the corresponding modules.
 */
export class RestDeepModulesImporter {
  protected shallowImports: RestShallowImports;
  protected moduleManager: ModuleManager;
  protected shallowImportsMap: Map<ModRefId, ShallowImports>;
  protected providersPerApp: Provider[];
  protected log: SystemLogMediator;
  protected parent: DeepModulesImporter;

  constructor({
    parent,
    shallowImports,
    moduleManager,
    shallowImportsMap,
    providersPerApp,
    log,
  }: DeepModulesImporterConfig) {
    this.parent = parent;
    this.shallowImports = shallowImports;
    this.moduleManager = moduleManager;
    this.shallowImportsMap = shallowImportsMap;
    this.providersPerApp = providersPerApp;
    this.log = log;
  }

  importModulesDeep(): RestMetadataPerMod2 | undefined {
    const { guards1, prefixPerMod, meta, applyControllers } = this.shallowImports;
    return {
      normalizedModuleMeta: this.shallowImports.normalizedModuleMeta,
      meta,
      guards1,
      prefixPerMod,
      applyControllers,
    };
  }
}
