import {
  makeClassDecorator,
  Providers,
  AttachedMetadata,
  mergeArrays,
  DecoratorAndValue,
  ModuleManager,
  Provider,
  GlobalProviders,
  ModRefId,
  ModuleParamItem,
  NormalizedMeta,
  ModuleWithParams,
  objectKeys,
} from '@ditsmod/core';

import { RoutingModuleParams, RoutingMetadata, RoutingMetadataWithParams } from '#module/module-metadata.js';
import { RoutingMetadataNormalizer } from '#module/routing-metadata-normalizer.js';
import { RoutingModuleFactory } from '#module/routing-module-factory.js';

export const routingMetadata: RoutingMetadataDecorator = makeClassDecorator(transformMetadata);

export function routingMetadataParams<T extends { path: any }>(metadata: T): ModuleParamItem<T> {
  return { decorator: routingMetadata, metadata };
}

export interface RoutingMetadataDecorator {
  (data?: RoutingMetadata): any;
}

function mergeModuleWithParams(modWitParams: ModuleWithParams, decorAndVal: DecoratorAndValue<AttachedMetadata>) {
  const metadata = decorAndVal.value.metadata as RoutingMetadata;
  const metadata1 = Object.assign({}, metadata) as RoutingMetadataWithParams;
  for (const param of modWitParams.params || []) {
    if (param.decorator !== decorAndVal.decorator) {
      continue;
    }
    objectKeys(param.metadata).forEach((p) => {
      // If here is object with [Symbol.iterator]() method, this transform it to an array.
      if (Array.isArray(param.metadata[p]) || param.metadata[p] instanceof Providers) {
        (metadata1 as any)[p] = mergeArrays((metadata1 as any)[p], param.metadata[p]);
      }
    });
    metadata1.path = (param.metadata as RoutingModuleParams).path;
    metadata1.absolutePath = (param.metadata as RoutingModuleParams).absolutePath;
    break;
  }
  return metadata1;
}

export function transformMetadata(data?: RoutingMetadata): AttachedMetadata {
  const metadata = Object.assign({}, data);
  return {
    isAttachedMetadata: true,
    metadata,
    mergeModuleWithParams,
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
