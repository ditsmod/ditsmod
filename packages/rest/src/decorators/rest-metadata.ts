import {
  makeClassDecorator,
  AttachedMetadata,
  ModuleManager,
  Provider,
  GlobalProviders,
  ModRefId,
  NormalizedMeta,
} from '@ditsmod/core';

import { RoutingMetadata } from '#module/module-metadata.js';
import { RoutingMetadataNormalizer } from '#module/rest-metadata-normalizer.js';
import { RoutingModuleFactory } from '#module/rest-module-factory.js';
import { RoutingNormalizedMeta } from '#types/rest-normalized-meta.js';

export const restMetadata: RoutingMetadataDecorator = makeClassDecorator(transformMetadata);

export interface RoutingMetadataDecorator {
  (data?: RoutingMetadata): any;
}

export function transformMetadata(data?: RoutingMetadata): AttachedMetadata {
  const metadata = Object.assign({}, data);
  return {
    isAttachedMetadata: true,
    metadata,
    normalize(baseMeta: NormalizedMeta, metadataWithParams: RoutingMetadata) {
      return new RoutingMetadataNormalizer().normalize(baseMeta, metadataWithParams);
    },
    getImportsOrExports(meta: RoutingNormalizedMeta) {
      return meta.appendsModules.concat(meta.appendsWithParams as any[]);
    },
    exportGlobalProviders(moduleManager: ModuleManager, baseMeta: NormalizedMeta, providersPerApp: Provider[]) {
      return new RoutingModuleFactory().exportGlobalProviders(moduleManager, baseMeta, providersPerApp);
    },
    bootstrap(
      ...args: [
        providersPerApp: Provider[],
        globalProviders: GlobalProviders,
        modRefId: ModRefId,
        moduleManager: ModuleManager,
        unfinishedScanModules: Set<ModRefId>,
      ]
    ) {
      return new RoutingModuleFactory().bootstrap(...args);
    },
  };
}
