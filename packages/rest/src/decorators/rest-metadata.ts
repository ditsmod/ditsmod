import {
  makeClassDecorator,
  InitHooksAndMetadata,
  ModuleManager,
  Provider,
  GlobalProviders,
  ModRefId,
  NormalizedMeta,
  SystemErrorMediator,
  SystemLogMediator,
  AnyObj,
  ShallowImportsBase,
} from '@ditsmod/core';

import { AddRest } from '#init/module-metadata.js';
import { ModuleNormalizer } from '#init/module-normalizer.js';
import { ShallowModulesImporter } from '#init/shallow-modules-importer.js';
import { RestMetadataPerMod1 } from '#init/types.js';
import { RestNormalizedMeta } from '#init/rest-normalized-meta.js';
import { DeepModulesImporter } from '#init/deep-modules-importer.js';
/**
 * A decorator that adds REST metadata to a `featureModule` or `rootModule`.
 */
export const addRest: AddRestDecorator = makeClassDecorator(transformMetadata);

export interface AddRestDecorator {
  (data?: AddRest): any;
}

class RestInitHooksAndMetadata extends InitHooksAndMetadata<AddRest> {
  override normalize(baseMeta: NormalizedMeta, metadataWithParams: AddRest) {
    return new ModuleNormalizer().normalize(baseMeta, metadataWithParams);
  }

  override getModulesToScan(meta?: RestNormalizedMeta) {
    return meta?.appendsModules.concat(meta.appendsWithParams as any[]) || [];
  }

  override exportGlobalProviders(moduleManager: ModuleManager, baseMeta: NormalizedMeta) {
    return new ShallowModulesImporter().exportGlobalProviders(moduleManager, baseMeta);
  }

  override collectProvidersShallow(
    ...args: [
      globalProviders: GlobalProviders,
      modRefId: ModRefId,
      moduleManager: ModuleManager,
      unfinishedScanModules: Set<ModRefId>,
    ]
  ): Map<ModRefId, RestMetadataPerMod1> {
    return new ShallowModulesImporter().collectProvidersShallow(...args);
  }

  override collectProvidersDeep(
    ...args: [
      restMetadataPerMod1: RestMetadataPerMod1,
      moduleManager: ModuleManager,
      shallowImportsBase: ShallowImportsBase,
      providersPerApp: Provider[],
      log: SystemLogMediator,
      errorMediator: SystemErrorMediator,
    ]
  ) {
    const impResolver = new DeepModulesImporter(...args);
    return impResolver.collectProvidersDeep();
  }
}

export function transformMetadata(data?: AddRest): InitHooksAndMetadata<AddRest> {
  const metadata = Object.assign({}, data);
  return new RestInitHooksAndMetadata(metadata);
}
