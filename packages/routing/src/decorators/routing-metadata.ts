import {
  makeClassDecorator,
  Providers,
  objectKeys,
  AttachedMetadata,
  mergeArrays,
  DecoratorAndValue,
  ModuleManager,
  Provider,
  GlobalProviders,
  ModRefId,
  ModuleParamItem,
  NormalizedMeta,
} from '@ditsmod/core';

import { RoutingModuleParams, RoutingMetadata } from '#module/module-metadata.js';
import { RoutingMetadataNormalizer } from '#module/routing-metadata-normalizer.js';
import { GuardItem, NormalizedGuard } from '#interceptors/guard.js';
import { RoutingNormalizedMeta } from '#types/routing-normalized-meta.js';
import { RoutingModuleFactory } from '#module/routing-module-factory.js';

export const routingMetadata: RoutingMetadataDecorator = makeClassDecorator(transformMetadata);

export function routingMetadataParams<T extends { path: any }>(metadata: T): ModuleParamItem<T> {
  return { decorator: routingMetadata, metadata };
}

export interface RoutingMetadataDecorator {
  (data?: RoutingMetadata): any;
}

function mergeModuleWithParams(params: RoutingModuleParams, decorAndVal: DecoratorAndValue<AttachedMetadata>) {
  const meta = decorAndVal.value.metadata as RoutingNormalizedMeta;

  objectKeys(params).forEach((p) => {
    // If here is object with [Symbol.iterator]() method, this transform it to an array.
    if (Array.isArray(params[p]) || params[p] instanceof Providers) {
      (meta as any)[p] = mergeArrays((meta as any)[p], params[p]);
    }
  });
  if (params.guards?.length) {
    meta.guardsPerMod.push(...normalizeGuards(params.guards));
    checkGuardsPerMod(meta.guardsPerMod);
  }
  return meta;
}

function normalizeGuards(guards?: GuardItem[]) {
  return (guards || []).map((item) => {
    if (Array.isArray(item)) {
      return { guard: item[0], params: item.slice(1) } as NormalizedGuard;
    } else {
      return { guard: item } as NormalizedGuard;
    }
  });
}

function checkGuardsPerMod(guards: NormalizedGuard[]) {
  for (const Guard of guards.map((n) => n.guard)) {
    const type = typeof Guard?.prototype.canActivate;
    if (type != 'function') {
      throw new TypeError(`Import with guards failed: Guard.prototype.canActivate must be a function, got: ${type}`);
    }
  }
}

export function transformMetadata(data?: RoutingMetadata): AttachedMetadata {
  return {
    isAttachedMetadata: true,
    metadata: data || {},
    normalize: (baseMeta: NormalizedMeta) => new RoutingMetadataNormalizer().normalize(baseMeta, data),
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
    mergeModuleWithParams,
  };
}
