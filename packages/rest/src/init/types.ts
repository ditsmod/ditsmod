import type {
  Provider,
  BaseMeta,
  AppProviders,
  ModRefId,
  ModuleManager,
  SystemLogMediator,
  DeepModulesImporter,
  ShallowImports,
} from '@ditsmod/core';

import type { GuardPerMod1 } from '#interceptors/guard.js';
import type { RestModRefId, RestInitMeta } from '#init/rest-init-meta.js';

export class RestProviderImport<T extends Provider = Provider> {
  modRefId: RestModRefId;
  /**
   * This property can have more than one element for multi-providers only.
   */
  providers: T[] = [];
}
/**
 * Metadata collected using `ShallowModulesImporter`. The target for this metadata is `DeepModulesImporter`.
 */
export class RestShallowImports {
  baseMeta: BaseMeta;
  prefixPerMod: string;
  guards1: GuardPerMod1[];
  /**
   * Snapshot of `RestInitMeta`. If you modify any array in this object,
   * the original array will remain unchanged.
   */
  meta: RestInitMeta;
  applyControllers?: boolean;
}

export interface RestBaseImportRegistry {
  perMod: Map<any, RestProviderImport>;
  perRou: Map<any, RestProviderImport>;
  perReq: Map<any, RestProviderImport>;
  multiPerMod: Map<RestModRefId, Provider[]>;
  multiPerRou: Map<RestModRefId, Provider[]>;
  multiPerReq: Map<RestModRefId, Provider[]>;
}

export class RestProvidersOnly {
  providersPerMod: Provider[] = [];
  providersPerRou: Provider[] = [];
  providersPerReq: Provider[] = [];
}
/**
 * This metadata returns from `DeepModulesImporter`. The target for this metadata is `RestRouteExtension`.
 */

export class RestMetadataPerMod2 {
  baseMeta: BaseMeta;
  meta: RestInitMeta;
  guards1: GuardPerMod1[];
  prefixPerMod: string;
  applyControllers?: boolean;
}

export interface ExportAppProvidersConfig {
  moduleManager: ModuleManager;
  appProviders: AppProviders;
  baseMeta: BaseMeta;
}

export interface ImportModulesShallowConfig {
  moduleManager: ModuleManager;
  appProviders: AppProviders;
  modRefId: ModRefId;
  unfinishedScanModules: Set<ModRefId>;
  prefixPerMod: string;
  guards1?: GuardPerMod1[];
  isAppends?: boolean;
}

export interface DeepModulesImporterConfig {
  parent: DeepModulesImporter;
  shallowImports: RestShallowImports;
  moduleManager: ModuleManager;
  shallowImportsMap: Map<ModRefId, ShallowImports>;
  providersPerApp: Provider[];
  log: SystemLogMediator;
}
