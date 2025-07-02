import {
  makeClassDecorator,
  Providers,
  AttachedMetadata,
  mergeArrays,
  ModuleManager,
  Provider,
  GlobalProviders,
  ModRefId,
  NormalizedMeta,
  ModuleWithParams,
  objectKeys,
} from '@ditsmod/core';

import { RoutingModuleParams, RoutingMetadata, RoutingMetadataWithParams } from '#module/module-metadata.js';
import { RoutingMetadataNormalizer } from '#module/routing-metadata-normalizer.js';
import { RoutingModuleFactory } from '#module/routing-module-factory.js';

export const routingMetadata: RoutingMetadataDecorator = makeClassDecorator(transformMetadata);

export interface RoutingMetadataDecorator {
  (data?: RoutingMetadata): any;
}

function mergeModuleWithParams(modWitParams: ModuleWithParams, metadata: RoutingMetadata) {
  const metadata1 = Object.assign({}, metadata) as RoutingMetadataWithParams;
  objectKeys(modWitParams).forEach((p) => {
    // If here is object with [Symbol.iterator]() method, this transform it to an array.
    if (Array.isArray(modWitParams[p]) || modWitParams[p] instanceof Providers) {
      (metadata1 as any)[p] = mergeArrays((metadata1 as any)[p], modWitParams[p]);
    }
  });
  metadata1.path = (modWitParams as RoutingModuleParams).path;
  metadata1.absolutePath = (modWitParams as RoutingModuleParams).absolutePath;

  return metadata1;
}

export function transformMetadata(data?: RoutingMetadata): AttachedMetadata {
  const metadata = Object.assign({}, data);
  return {
    isAttachedMetadata: true,
    metadata,
    mergeModuleWithParams: (modWitParams) => mergeModuleWithParams(modWitParams, metadata),
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
