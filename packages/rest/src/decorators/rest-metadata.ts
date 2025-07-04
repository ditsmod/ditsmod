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

export const restMetadata: RoutingMetadataDecorator = makeClassDecorator(transformMetadata);

export interface RoutingMetadataDecorator {
  (data?: RoutingMetadata): any;
}

export function transformMetadata(data?: RoutingMetadata): AttachedMetadata {
  const metadata = Object.assign({}, data);
  return {
    isAttachedMetadata: true,
    metadata,
    normalize: (baseMeta: NormalizedMeta, metadataWithParams: RoutingMetadata) =>
      new RoutingMetadataNormalizer().normalize(baseMeta, metadataWithParams),
    exportGlobalProviders: (moduleManager: ModuleManager, baseMeta: NormalizedMeta, providersPerApp: Provider[]) => {
      new RoutingModuleFactory().exportGlobalProviders(moduleManager, baseMeta, providersPerApp);
    },
    bootstrap: (
      ...args: [
        providersPerApp: Provider[],
        globalProviders: GlobalProviders,
        modRefId: ModRefId,
        moduleManager: ModuleManager,
        unfinishedScanModules: Set<ModRefId>,
      ]
    ) => new RoutingModuleFactory().bootstrap(...args),
  };
}
