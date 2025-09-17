import {
  ModRefId,
  Provider,
  ModuleManager,
  SystemLogMediator,
  DeepModulesImporter,
  ShallowImports,
} from '@ditsmod/core';

import { DeepModulesImporterConfig, RestMetadataPerMod2, RestProvidersOnly, RestShallowImports } from './types.js';
import { defaultProvidersPerRou } from '#providers/default-providers-per-rou.js';
import { defaultProvidersPerReq } from '#providers/default-providers-per-req.js';

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
    meta.providersPerRou.unshift(...defaultProvidersPerRou);
    meta.providersPerReq.unshift(...defaultProvidersPerReq);
    return {
      baseMeta: this.shallowImports.baseMeta,
      meta,
      guards1,
      prefixPerMod,
      applyControllers,
    };
  }
}
