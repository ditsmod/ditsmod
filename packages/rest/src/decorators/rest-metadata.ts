import { makeClassDecorator, InitHooksAndMetadata, ModRefId, NormalizedMeta, AddDecorator } from '@ditsmod/core';

import { RestMetadata } from '#init/module-metadata.js';
import { ModuleNormalizer } from '#init/module-normalizer.js';
import { ShallowModulesImporter } from '#init/shallow-modules-importer.js';
import {
  DeepModulesImporterConfig,
  ExportGlobalProvidersConfig,
  ImportModulesShallowConfig,
  RestMetadataPerMod1,
} from '#init/types.js';
import { RestModRefId, RestNormalizedMeta } from '#init/rest-normalized-meta.js';
import { DeepModulesImporter } from '#init/deep-modules-importer.js';
import { RestGlobalProviders } from '#types/types.js';
/**
 * A decorator that adds REST metadata to a `featureModule` or `rootModule`.
 */
export const addRest: AddDecorator<RestMetadata, RestNormalizedMeta> = makeClassDecorator(transformMetadata);

class RestInitHooksAndMetadata extends InitHooksAndMetadata<RestMetadata> {
  override normalize(baseMeta: NormalizedMeta): RestNormalizedMeta {
    return new ModuleNormalizer().normalize(baseMeta, this.rawMeta);
  }

  override getModulesToScan(meta?: RestNormalizedMeta): RestModRefId[] {
    return meta?.appendsModules.concat(meta?.appendsWithParams as any[]) || [];
  }
  override exportGlobalProviders(config: ExportGlobalProvidersConfig): RestGlobalProviders {
    return new ShallowModulesImporter().exportGlobalProviders(config);
  }

  override importModulesShallow(config: ImportModulesShallowConfig): Map<ModRefId, RestMetadataPerMod1> {
    return new ShallowModulesImporter().importModulesShallow(config);
  }

  override importModulesDeep(config: DeepModulesImporterConfig) {
    return new DeepModulesImporter(config).importModulesDeep();
  }
}

export function transformMetadata(data?: RestMetadata): InitHooksAndMetadata<RestMetadata> {
  const metadata = Object.assign({}, data);
  return new RestInitHooksAndMetadata(metadata);
}
