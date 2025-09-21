import {
  ModRefId,
  Provider,
  ModuleManager,
  SystemLogMediator,
  DeepModulesImporter,
  ShallowImports,
  ModuleExtract,
  BaseMeta,
} from '@ditsmod/core';

import { DeepModulesImporterConfig, TrpcInitMeta } from '#decorators/trpc-init-hooks-and-metadata.js';
import { TrpcShallowImports } from '#decorators/trpc-init-hooks-and-metadata.js';
import { GuardPerMod1 } from '#interceptors/trpc-guard.js';

/**
 * This metadata returns from `DeepModulesImporter`. The target for this metadata is `RoutesExtension`.
 */

export class TrpcMetadataPerMod2 {
  baseMeta: BaseMeta;
  meta: TrpcInitMeta;
  guards1: GuardPerMod1[];
}

export class TrpcModuleExtract extends ModuleExtract {}

/**
 * By analyzing the dependencies of the providers returned by `ShallowModulesImporter`,
 * recursively collects providers for them from the corresponding modules.
 */
export class TrpcDeepModulesImporter {
  protected tokensPerApp: any[];

  protected shallowImports: TrpcShallowImports;
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
