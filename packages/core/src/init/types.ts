import { AnyFn, AnyObj, ModRefId } from '#types/mix.js';
import { BaseMeta } from '#types/base-meta.js';
import { ProviderImport } from '#types/metadata-per-mod.js';
import { Provider } from '#di/types-and-models.js';

export type ShallowImports<T extends AnyObj = AnyObj> = Map<ModRefId, NewShallowImports<T>>;

/**
 * Metadata collected using `ShallowModulesImporter`. The target for this metadata is `DeepModulesImporter`.
 */
export class NewShallowImports<T extends AnyObj = AnyObj> {
  /**
   * Snapshot of BaseMeta. If you modify any array in this object,
   * the original array will remain unchanged.
   */
  baseMeta: BaseMeta;
  /**
   * Map between a token and its ProviderImport per level.
   */
  importedTokensMap: ImportedTokensMap;
  initMap = new Map<AnyFn, { baseMeta: BaseMeta } & T>();

  constructor(baseMeta?: BaseMeta, importedTokensMap?: ImportedTokensMap) {
    if (baseMeta) {
      this.baseMeta = baseMeta;
    }
    if (importedTokensMap) {
      this.importedTokensMap = importedTokensMap;
    }
  }
}

export interface ImportedTokensMap {
  /**
   * `Map<token, ProviderImport>`
   */
  perMod: Map<any, ProviderImport>;
  multiPerMod: Map<ModRefId, Provider[]>;
  extensions: Map<ModRefId, Provider[]>;
}
