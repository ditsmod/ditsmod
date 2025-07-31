import {
  Provider,
  NormalizedMeta,
  GlobalProviders,
  ModRefId,
  ShallowImportsBase,
  ModuleManager,
  ShallowImports,
  SystemErrorMediator,
  SystemLogMediator,
  DeepModulesImporter,
} from '@ditsmod/core';

import { GuardPerMod1 } from '#interceptors/guard.js';
import { RestModRefId, RestInitMeta } from '#init/rest-normalized-meta.js';

export class RestImportObj<T extends Provider = Provider> {
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
  baseMeta: NormalizedMeta;
  prefixPerMod: string;
  guards1: GuardPerMod1[];
  /**
   * Snapshot of `RestInitMeta`. If you modify any array in this object,
   * the original array will remain unchanged.
   */
  meta: RestInitMeta;
  /**
   * Map between a token and its ImportObj per level.
   */
  importedTokensMap: RestImportedTokensMap;
  applyControllers?: boolean;
}

export interface RestImportedTokensMap {
  perRou: Map<any, RestImportObj>;
  perReq: Map<any, RestImportObj>;
  multiPerRou: Map<RestModRefId, Provider[]>;
  multiPerReq: Map<RestModRefId, Provider[]>;
}

export class RestProvidersForMod {
  // providersPerMod: Provider[] = [];
  providersPerRou: Provider[] = [];
  providersPerReq: Provider[] = [];
}
/**
 * This metadata returns from `DeepModulesImporter`. The target for this metadata is `RoutesExtension`.
 */

export class RestMetadataPerMod2 {
  baseMeta: NormalizedMeta;
  meta: RestInitMeta;
  guards1: GuardPerMod1[];
  prefixPerMod: string;
  applyControllers?: boolean;
}

export interface ExportGlobalProvidersConfig {
  moduleManager: ModuleManager;
  globalProviders: GlobalProviders;
  baseMeta: NormalizedMeta;
}

export interface ImportModulesShallowConfig {
  shallowImportsBase: ShallowImportsBase;
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
  shallowImports: ShallowImports;
  providersPerApp: Provider[];
  log: SystemLogMediator;
  errorMediator: SystemErrorMediator;
}
