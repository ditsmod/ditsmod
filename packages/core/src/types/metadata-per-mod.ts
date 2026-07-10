import type { NormalizedModuleMeta } from '#init/base-meta.js';
import type { AnyObj, ModRefId } from './mix.js';
import type { AnyFn, Provider } from '#di/top/types-and-models.js';
import type { ExtensionConfig } from '#extension/extension-providers-and-configs.js';
import type { InitDecoratorOptions, InitHooks } from '#decorators/init-hooks-and-metadata.js';
import type { ExtensionClass } from '#extension/extension-types.js';
import type { GroupToken } from '#di/key-registry.js';

/**
 * Used to create a mapping between a provider and the module from which it was imported.
 */
export class ImportedProvider<T extends Provider = Provider> {
  modRefId: ModRefId;
  /**
   * This property can have more than one element for multi-providers only.
   */
  providers: T[] = [];
  declare reexporter?: ModRefId;
}

export class AppInitHooks<T extends InitDecoratorOptions = InitDecoratorOptions> {
  /**
   * The presence of this property indicates whether at least one app provider is exported.
   */
  initHooks?: InitHooks<T>;
}

export class AppProviders {
  importedProvidersPerMod = new Map<any, ImportedProvider>();
  importedProvidersPerRou = new Map<any, ImportedProvider>();
  importedProvidersPerReq = new Map<any, ImportedProvider>();
  importedMultiProvidersPerMod = new Map<ModRefId, Provider[]>();
  importedMultiProvidersPerRou = new Map<ModRefId, Provider[]>();
  importedMultiProvidersPerReq = new Map<ModRefId, Provider[]>();
  importedExtensionProviders = new Map<ModRefId, Provider[]>();
  importedExtensionGroupTokens = new Map<ModRefId, Map<ExtensionClass, GroupToken>>();
  aImportedExtensionConfig: ExtensionConfig[] = [];
  mInitValue = new Map<AnyFn, AppInitHooks>();
}

export class ResolvedModuleMetadata<T extends AnyObj = AnyObj> {
  normalizedModuleMeta: NormalizedModuleMeta;
  aOrderedExtensions: ExtensionClass[];
  deepImportedModules: Map<AnyFn, T>;
}
