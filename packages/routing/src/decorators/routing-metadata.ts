import {
  makeClassDecorator,
  AttachedMetadata,
  ModuleManager,
  Provider,
  GlobalProviders,
  ModRefId,
  NormalizedMeta,
} from '@ditsmod/core';

import { RoutingMetadata, RoutingMetadataWithParams } from '#module/module-metadata.js';
import { RoutingMetadataNormalizer } from '#module/routing-metadata-normalizer.js';
import { RoutingModuleFactory } from '#module/routing-module-factory.js';

export const routingMetadata: RoutingMetadataDecorator = makeClassDecorator(transformMetadata);

export interface RoutingMetadataDecorator {
  (data?: RoutingMetadata): any;
}

export function transformMetadata(data?: RoutingMetadata): AttachedMetadata {
  const metadata = Object.assign({}, data);
  return {
    isAttachedMetadata: true,
    metadata,
    normalize: (baseMeta: NormalizedMeta, metadataWithParams: RoutingMetadataWithParams) =>
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
