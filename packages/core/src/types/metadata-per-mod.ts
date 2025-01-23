import { NormalizedMeta } from '#types/normalized-meta.js';
import { ModRefId, ModuleType } from './mix.js';
import { Provider } from '#di/types-and-models.js';
import { BaseModuleWithParams } from './module-metadata.js';
import { ExtensionConfig } from '#extension/get-extension-provider.js';

/**
 * @todo Rename this.
 */
export class ImportObj<T extends Provider = Provider> {
  modRefId: ModRefId;
  /**
   * This property can have more than one element for multi-providers only.
   */
  providers: T[] = [];
}

export class GlobalProviders {
  importedProvidersPerMod = new Map<any, ImportObj>();
  importedProvidersPerRou = new Map<any, ImportObj>();
  importedProvidersPerReq = new Map<any, ImportObj>();
  importedMultiProvidersPerMod = new Map<ModuleType | BaseModuleWithParams, Provider[]>();
  importedMultiProvidersPerRou = new Map<ModuleType | BaseModuleWithParams, Provider[]>();
  importedMultiProvidersPerReq = new Map<ModuleType | BaseModuleWithParams, Provider[]>();
  importedExtensions = new Map<ModuleType | BaseModuleWithParams, Provider[]>();
  aImportedExtensionConfig: ExtensionConfig[] = [];
}

/**
 * Metadata collected using `ModuleFactory`. The target for this metadata is `ImportsResolver`.
 */
export class MetadataPerMod1 {
  prefixPerMod: string;
  // guardsPerMod1: GuardPerMod1[];
  /**
   * Snapshot of NormalizedMeta. If you modify any array in this object,
   * the original array will remain unchanged.
   */
  meta: NormalizedMeta;
  /**
   * Map between a token and its ImportObj per level.
   */
  importedTokensMap: ImportedTokensMap;
}

export interface ImportedTokensMap {
  perMod: Map<any, ImportObj>;
  perRou: Map<any, ImportObj>;
  perReq: Map<any, ImportObj>;
  multiPerMod: Map<ModuleType | BaseModuleWithParams, Provider[]>;
  multiPerRou: Map<ModuleType | BaseModuleWithParams, Provider[]>;
  multiPerReq: Map<ModuleType | BaseModuleWithParams, Provider[]>;
  extensions: Map<ModuleType | BaseModuleWithParams, Provider[]>;
}

/**
 * This metadata returns from `ImportsResolver`. The target for this metadata is `RoutesExtension`.
 */
export class MetadataPerMod2 {
  // applyControllers?: boolean;
  prefixPerMod: string;
  meta: NormalizedMeta;
  // guardsPerMod1: GuardPerMod1[];
}
