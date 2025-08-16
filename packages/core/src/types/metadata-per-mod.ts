import { BaseMeta } from '#types/base-meta.js';
import { AnyFn, AnyObj, ModRefId } from './mix.js';
import { Provider } from '#di/types-and-models.js';
import { ExtensionConfig } from '#extension/get-extension-provider.js';
import { BaseInitRawMeta, InitHooksAndRawMeta } from '#decorators/init-hooks-and-metadata.js';
import { ExtensionClass } from '#extension/extension-types.js';

/**
 * Used to create a mapping between a provider and the module from which it was imported.
 */
export class ProviderImport<T extends Provider = Provider> {
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
  importedProvidersPerMod = new Map<any, ProviderImport>();
  importedMultiProvidersPerMod = new Map<ModRefId, Provider[]>();
  importedExtensions = new Map<ModRefId, Provider[]>();
  aImportedExtensionConfig: ExtensionConfig[] = [];
  mInitValue = new Map<AnyFn, GlobalInitHooks>();
}

export class MetadataPerMod2<T extends AnyObj = AnyObj> {
  baseMeta: BaseMeta;
  aOrderedExtensions: ExtensionClass[];
  deepImportedModules: Map<AnyFn, T>;
}
