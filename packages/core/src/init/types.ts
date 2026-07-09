import type { AnyObj, ModRefId } from '#types/mix.js';
import type { AnyFn, Provider } from '#di/top/types-and-models.js';
import type { NormalizedModuleMeta } from '#init/base-meta.js';
import type { ProviderImport } from '#types/metadata-per-mod.js';
import type { ExtensionClass } from '#extension/extension-types.js';
import type { GroupToken } from '#di/key-registry.js';

/**
 * Metadata collected using `ShallowModulesImporter`. The target for this metadata is `DeepModulesImporter`.
 */
export class ShallowImports<T extends AnyObj = AnyObj> {
  /**
   * Snapshot of NormalizedModuleMeta. If you modify any array in this object,
   * the original array will remain unchanged.
   */
  normalizedModuleMeta: NormalizedModuleMeta;
  /**
   * Map between a token and its ProviderImport per level.
   */
  baseImportRegistry: BaseImportRegistry;
  initImportRegistryMap = new Map<AnyFn, { normalizedModuleMeta: NormalizedModuleMeta } & T>();
  aOrderedExtensions: ExtensionClass[] = [];

  constructor(normalizedModuleMeta?: NormalizedModuleMeta, aOrderedExtensions?: ExtensionClass[], baseImportRegistry?: BaseImportRegistry) {
    if (normalizedModuleMeta) {
      this.normalizedModuleMeta = normalizedModuleMeta;
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
  /**
   * `Map<token, ProviderImport>`
   */
  perRou: Map<any, ProviderImport>;
  /**
   * `Map<token, ProviderImport>`
   */
  perReq: Map<any, ProviderImport>;
  multiPerMod: Map<ModRefId, Provider[]>;
  multiPerRou: Map<ModRefId, Provider[]>;
  multiPerReq: Map<ModRefId, Provider[]>;
  extensionProviders: Map<ModRefId, Provider[]>;
  extensionGroupTokens: Map<ModRefId, Map<ExtensionClass, GroupToken>>;
}
