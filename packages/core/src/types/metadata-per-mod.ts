import { BaseMeta } from '#types/base-meta.js';
import { AnyFn, AnyObj, ModRefId } from './mix.js';
import { Provider } from '#di/types-and-models.js';
import { ExtensionConfig } from '#extension/get-extension-provider.js';
import { BaseInitRawMeta, InitHooksAndRawMeta } from '#decorators/init-hooks-and-metadata.js';

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

export class GlobalInitHooks<T extends BaseInitRawMeta = BaseInitRawMeta> {
  /**
   * The presence of this property indicates whether at least one global provider is exported.
   */
  initHooks?: InitHooksAndRawMeta<T>;
}

export class GlobalProviders {
  importedProvidersPerMod = new Map<any, ImportObj>();
  importedMultiProvidersPerMod = new Map<ModRefId, Provider[]>();
  importedExtensions = new Map<ModRefId, Provider[]>();
  aImportedExtensionConfig: ExtensionConfig[] = [];
  mInitHooks = new Map<AnyFn, GlobalInitHooks>();
}

/**
 * Metadata collected using `ShallowModulesImporter`. The target for this metadata is `DeepModulesImporter`.
 */
export class MetadataPerMod1 {
  /**
   * Snapshot of BaseMeta. If you modify any array in this object,
   * the original array will remain unchanged.
   */
  baseMeta: BaseMeta;
  /**
   * Map between a token and its ImportObj per level.
   */
  importedTokensMap: ImportedTokensMap;
}

export interface ImportedTokensMap {
  /**
   * `Map<token, ImportObj>`
   */
  perMod: Map<any, ImportObj>;
  multiPerMod: Map<ModRefId, Provider[]>;
  extensions: Map<ModRefId, Provider[]>;
}

export class MetadataPerMod2<T extends AnyObj = AnyObj> {
  baseMeta: BaseMeta;
  deepImportedModules: Map<AnyFn, T>;
}
