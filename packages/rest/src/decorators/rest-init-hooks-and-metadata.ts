import { makeClassDecorator, InitHooksAndRawMeta, ModRefId, NormalizedMeta, AddDecorator, BaseInitMeta } from '@ditsmod/core';

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
import { RestModule } from '#init/rest.module.js';

/**
 * A decorator that adds REST metadata to a `featureModule` or `rootModule`.
 */
export const initRest: AddDecorator<RestMetadata, RestNormalizedMeta> = makeClassDecorator(transformMetadata);

class RestInitHooksAndRawMeta extends InitHooksAndRawMeta<RestMetadata> {
  override hostModule = RestModule;

  override normalize(baseMeta: NormalizedMeta): RestNormalizedMeta {
    return new ModuleNormalizer().normalize(baseMeta, this.rawMeta, this.baseInitMeta);
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

export function transformMetadata(data?: RestMetadata): InitHooksAndRawMeta<RestMetadata> {
  const metadata = Object.assign({}, data);
  return new RestInitHooksAndRawMeta(metadata);
}
