import {
  ModRefId,
  Provider,
  ModuleManager,
  SystemLogMediator,
  DeepModulesImporter,
  ShallowImports,
} from '@ditsmod/core';

import { DeepModulesImporterConfig, RestShallowImports } from './types.js';

/**
 * By analyzing the dependencies of the providers returned by `ShallowModulesImporter`,
 * recursively collects providers for them from the corresponding modules.
 */
export class RestDeepModulesImporter {
  protected tokensPerApp: any[];

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
}
