import { AnyFn, AnyObj, ModRefId } from '#types/mix.js';
import { BaseMeta } from '#types/base-meta.js';
import { ImportedTokensMap } from '#types/metadata-per-mod.js';

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
