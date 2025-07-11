import { NormalizedMeta } from '#types/normalized-meta.js';
import { AnyFn, AnyObj, ModRefId, ModuleType } from './mix.js';
import { Provider } from '#di/types-and-models.js';
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
  importedMultiProvidersPerMod = new Map<ModuleType | ModuleWithParams, Provider[]>();
  importedExtensions = new Map<ModuleType | ModuleWithParams, Provider[]>();
  aImportedExtensionConfig: ExtensionConfig[] = [];
  shallowImportedModules: Map<AnyFn, AnyObj | undefined>;
}

/**
 * Metadata collected using `ShallowModulesImporter`. The target for this metadata is `DeepModulesImporter`.
 */
export class MetadataPerMod1 {
  /**
   * Snapshot of NormalizedMeta. If you modify any array in this object,
   * the original array will remain unchanged.
   */
  baseMeta: NormalizedMeta;
  /**
   * Map between a token and its ImportObj per level.
   */
  importedTokensMap: ImportedTokensMap;
}

export interface ImportedTokensMap {
  perMod: Map<any, ImportObj>;
  multiPerMod: Map<ModuleType | ModuleWithParams, Provider[]>;
  extensions: Map<ModuleType | ModuleWithParams, Provider[]>;
}

export class MetadataPerMod2<T extends AnyObj = AnyObj> {
  baseMeta: NormalizedMeta;
  deepImportedModules: Map<AnyFn, T>;
}
