import { AnyFn, AnyObj, ModRefId } from '#types/mix.js';
import { BaseMeta } from '#types/base-meta.js';
import { ProviderImport } from '#types/metadata-per-mod.js';
import { Provider } from '#di/types-and-models.js';
import { ExtensionClass } from '#extension/extension-types.js';

/**
 * Metadata collected using `ShallowModulesImporter`. The target for this metadata is `DeepModulesImporter`.
 */
export class ShallowImports<T extends AnyObj = AnyObj> {
  /**
   * Snapshot of BaseMeta. If you modify any array in this object,
   * the original array will remain unchanged.
   */
  baseMeta: BaseMeta;
  /**
   * Map between a token and its ProviderImport per level.
   */
  baseImportRegistry: BaseImportRegistry;
  initImportRegistryMap = new Map<AnyFn, { baseMeta: BaseMeta } & T>();
  aOrderedExtensions: ExtensionClass[] = [];

  constructor(baseMeta?: BaseMeta, aOrderedExtensions?: ExtensionClass[], baseImportRegistry?: BaseImportRegistry) {
    if (baseMeta) {
      this.baseMeta = baseMeta;
    }
    if (aOrderedExtensions) {
      this.aOrderedExtensions = aOrderedExtensions;
    }
    if (baseImportRegistry) {
      this.baseImportRegistry = baseImportRegistry;
    }
  }
}

export interface BaseImportRegistry {
  /**
   * `Map<token, ProviderImport>`
   */
  perMod: Map<any, ProviderImport>;
  multiPerMod: Map<ModRefId, Provider[]>;
  extensions: Map<ModRefId, Provider[]>;
}
