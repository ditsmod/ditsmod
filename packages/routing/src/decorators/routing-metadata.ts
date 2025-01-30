import { makeClassDecorator, Providers, AnyFn, objectKeys, AttachedMetadata } from '@ditsmod/core';

import { RoutingMetadata } from '#module/module-metadata.js';

export const routingMetadata: RoutingMetadataDecorator = makeClassDecorator(transformMetadata);

export interface RoutingMetadataDecorator {
  (data?: RoutingMetadata): any;
}

export function transformMetadata(data?: RoutingMetadata): AttachedMetadata {
  const metadata = Object.assign({}, data);
  objectKeys(metadata).forEach((p) => {
    // If here is object with [Symbol.iterator]() method, this transform it to an array.
    if (metadata[p] instanceof Providers) {
      (metadata as any)[p] = [...metadata[p]];
    }
  });
  return { isAttachedMetadata: true, metadata};
}

/**
 * Raw routing metadata returned by reflector.
 */
export interface RoutingRawMeta extends RoutingMetadata {
  decorator: AnyFn;
}
