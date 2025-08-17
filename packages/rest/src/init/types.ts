import {
  Provider,
  BaseMeta,
  GlobalProviders,
  ModRefId,
  ModuleManager,
  SystemLogMediator,
  DeepModulesImporter,
  NewShallowImports,
} from '@ditsmod/core';

import { GuardPerMod1 } from '#interceptors/guard.js';
import { RestModRefId, RestInitMeta } from '#init/rest-init-meta.js';

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
export class RestMetadataPerMod1 {
  baseMeta: BaseMeta;
  prefixPerMod: string;
  guards1: GuardPerMod1[];
  /**
   * Snapshot of `RestInitMeta`. If you modify any array in this object,
   * the original array will remain unchanged.
   */
  meta: RestInitMeta;
  /**
   * Map between a token and its ProviderImport per level.
   */
  baseImportRegistry: RestBaseImportRegistry;
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
 * This metadata returns from `DeepModulesImporter`. The target for this metadata is `RoutesExtension`.
 */

export class RestMetadataPerMod2 {
  baseMeta: BaseMeta;
  meta: RestInitMeta;
  guards1: GuardPerMod1[];
  prefixPerMod: string;
  applyControllers?: boolean;
}

export interface ExportGlobalProvidersConfig {
  moduleManager: ModuleManager;
  globalProviders: GlobalProviders;
  baseMeta: BaseMeta;
}

export interface ImportModulesShallowConfig {
  moduleManager: ModuleManager;
  providersPerApp: Provider[];
  globalProviders: GlobalProviders;
  modRefId: ModRefId;
  unfinishedScanModules: Set<ModRefId>;
  prefixPerMod: string;
  guards1?: GuardPerMod1[];
  isAppends?: boolean;
}

export interface DeepModulesImporterConfig {
  parent: DeepModulesImporter;
  metadataPerMod1: RestMetadataPerMod1;
  moduleManager: ModuleManager;
  shallowImportsMap: Map<ModRefId, NewShallowImports>;
  providersPerApp: Provider[];
  log: SystemLogMediator;
}
