import { makeClassDecorator, InitHooksAndRawMeta, ModRefId, NormalizedMeta, AddDecorator, BaseInitMeta } from '@ditsmod/core';

import { RestInitRawMeta } from '#init/module-metadata.js';
import { ModuleNormalizer } from '#init/module-normalizer.js';
import { ShallowModulesImporter } from '#init/shallow-modules-importer.js';
import {
  DeepModulesImporterConfig,
  ExportGlobalProvidersConfig,
  ImportModulesShallowConfig,
  RestMetadataPerMod1,
} from '#init/types.js';
import { RestModRefId, RestInitMeta } from '#init/rest-normalized-meta.js';
import { DeepModulesImporter } from '#init/deep-modules-importer.js';
import { RestGlobalProviders } from '#types/types.js';
import { RestModule } from '#init/rest.module.js';

/**
 * A decorator that adds REST metadata to a `featureModule` or `rootModule`.
 */
export const initRest: AddDecorator<RestInitRawMeta, RestInitMeta> = makeClassDecorator(transformMetadata);

class RestInitHooksAndRawMeta extends InitHooksAndRawMeta<RestInitRawMeta> {
  override hostModule = RestModule;

  override normalize(baseMeta: NormalizedMeta): RestInitMeta {
    return new ModuleNormalizer().normalize(baseMeta, this.rawMeta, this.baseInitMeta);
  }

  override getModulesToScan(meta?: RestInitMeta): RestModRefId[] {
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

export function transformMetadata(data?: RestInitRawMeta): InitHooksAndRawMeta<RestInitRawMeta> {
  const metadata = Object.assign({}, data);
  return new RestInitHooksAndRawMeta(metadata);
}
