import { NormalizedModuleMetadata } from '#types/normalized-module-metadata.js';
import { GuardPerMod1, ModRefId, ModuleType, Provider } from './mix.js';
import { ModuleWithParams } from './module-metadata.js';
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
  importedMultiProvidersPerMod = new Map<ModuleType | ModuleWithParams, Provider[]>();
  importedMultiProvidersPerRou = new Map<ModuleType | ModuleWithParams, Provider[]>();
  importedMultiProvidersPerReq = new Map<ModuleType | ModuleWithParams, Provider[]>();
  importedExtensions = new Map<ModuleType | ModuleWithParams, Provider[]>();
  aImportedExtensionConfig: ExtensionConfig[] = [];
}

/**
 * Metadata collected using `ModuleFactory`. The target for this metadata is `ImportsResolver`.
 */
export class MetadataPerMod1 {
  prefixPerMod: string;
  guardsPerMod1: GuardPerMod1[];
  /**
   * Snapshot of NormalizedModuleMetadata. If you modify any array in this object,
   * the original array will remain unchanged.
   */
  meta: NormalizedModuleMetadata;
  /**
   * Specifies whether to apply controllers in the current module.
   */
  applyControllers?: boolean;
  /**
   * Map between a token and its ImportObj per scope.
   */
  importedTokensMap: ImportedTokensMap;
}

export interface ImportedTokensMap {
  perMod: Map<any, ImportObj>;
  perRou: Map<any, ImportObj>;
  perReq: Map<any, ImportObj>;
  multiPerMod: Map<ModuleType | ModuleWithParams, Provider[]>;
  multiPerRou: Map<ModuleType | ModuleWithParams, Provider[]>;
  multiPerReq: Map<ModuleType | ModuleWithParams, Provider[]>;
  extensions: Map<ModuleType | ModuleWithParams, Provider[]>;
}

/**
 * This metadata returns from `ImportsResolver`. The target for this metadata is `ROUTE_EXTENSIONS` group.
 */
export class MetadataPerMod2 {
  applyControllers?: boolean;
  prefixPerMod: string;
  meta: NormalizedModuleMetadata;
  guardsPerMod1: GuardPerMod1[];
}
