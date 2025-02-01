import {
  makeClassDecorator,
  Providers,
  AnyFn,
  objectKeys,
  AttachedMetadata,
  mergeArrays,
  DecoratorAndValue,
  ModuleWithParams,
  RawMeta,
  Override,
} from '@ditsmod/core';

import { RoutingMetadata } from '#module/module-metadata.js';

export const routingMetadata: RoutingMetadataDecorator = makeClassDecorator(transformMetadata);

export interface RoutingMetadataDecorator {
  (data?: RoutingMetadata): any;
}

function mergeModuleWithParams(modWitParams: ModuleWithParams, decorAndVal: DecoratorAndValue<AttachedMetadata>) {
  const rawMeta = Object.assign({}, decorAndVal.value.metadata) as RawMeta;
  for (const param of modWitParams.params) {
    if (param.decorator !== decorAndVal.decorator) {
      continue;
    }
    objectKeys(param.metadata).forEach((p) => {
      // If here is object with [Symbol.iterator]() method, this transform it to an array.
      if (Array.isArray(param.metadata[p]) || param.metadata[p] instanceof Providers) {
        (rawMeta as any)[p] = mergeArrays((rawMeta as any)[p], param.metadata[p]);
      }
    });
  }
  return rawMeta;
}

export function transformMetadata(data?: RoutingMetadata): Override<AttachedMetadata, { metadata: RawMeta }> {
  const metadata = Object.assign({}, data) as RawMeta;
  objectKeys(metadata).forEach((p) => {
    // If here is object with [Symbol.iterator]() method, this transform it to an array.
    if (metadata[p] instanceof Providers) {
      (metadata as any)[p] = [...metadata[p]];
    }
  });
  return { isAttachedMetadata: true, metadata, mergeModuleWithParams };
}

/**
 * Raw routing metadata returned by reflector.
 */
export interface RoutingRawMeta extends RoutingMetadata {
  decorator: AnyFn;
}
