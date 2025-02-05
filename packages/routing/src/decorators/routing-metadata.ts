import {
  makeClassDecorator,
  Providers,
  objectKeys,
  AttachedMetadata,
  mergeArrays,
  DecoratorAndValue,
  ModuleWithParams,
} from '@ditsmod/core';

import { RoutingModuleParams, RoutingMetadata } from '#module/module-metadata.js';
import { RoutingMetadataNormalizer } from '#module/routing-metadata-normalizer.js';
import { GuardItem, NormalizedGuard } from '#interceptors/guard.js';
import { RoutingNormalizedMeta } from '#types/routing-normalized-meta.js';

export const routingMetadata: RoutingMetadataDecorator = makeClassDecorator(transformMetadata);

export interface RoutingMetadataDecorator {
  (data?: RoutingMetadata): any;
}

function mergeModuleWithParams(modWitParams: ModuleWithParams, decorAndVal: DecoratorAndValue<AttachedMetadata>) {
  const meta = decorAndVal.value.metadata as RoutingNormalizedMeta;
  for (const param of modWitParams.params) {
    if (param.decorator !== decorAndVal.decorator) {
      continue;
    }
    objectKeys(param.metadata).forEach((p) => {
      // If here is object with [Symbol.iterator]() method, this transform it to an array.
      if (Array.isArray(param.metadata[p]) || param.metadata[p] instanceof Providers) {
        (meta as any)[p] = mergeArrays((meta as any)[p], param.metadata[p]);
      }
    });
    if ((param.metadata as RoutingModuleParams).guards?.length) {
      meta.guardsPerMod.push(...normalizeGuards((param.metadata as RoutingModuleParams).guards));
      checkGuardsPerMod(meta.guardsPerMod);
    }
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
  const metadata = new RoutingMetadataNormalizer().normalize(data);
  return { isAttachedMetadata: true, metadata, mergeModuleWithParams };
}
