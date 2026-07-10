import type {
  ModRefId,
  Provider,
  ModuleManager,
  SystemLogMediator,
  DeepModulesImporter,
  ShallowImports,
  NormalizedModuleMeta,
} from '@ditsmod/core';
import { ModuleInfo } from '@ditsmod/core';

import type { DeepModulesImporterConfig, TrpcInitMeta } from '#decorators/trpc-init-hooks-and-metadata.js';
import type { TrpcShallowImports } from '#decorators/trpc-init-hooks-and-metadata.js';
import type { GuardPerMod1 } from '#interceptors/trpc-guard.js';

/**
 * This metadata returns from `DeepModulesImporter`. The target for this metadata is `RestRouteExtension`.
 */

export class TrpcMetadataPerMod2 {
  normalizedModuleMeta: NormalizedModuleMeta;
  meta: TrpcInitMeta;
  guards1: GuardPerMod1[];
}

export class TrpcModuleInfo extends ModuleInfo {}

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
