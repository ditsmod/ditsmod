import {
  makeClassDecorator,
  Providers,
  CallsiteUtils,
  AnyFn,
  ModuleType,
  BaseModuleWithParams,
  objectKeys,
} from '@ditsmod/core';

import { RoutingMetadata } from '#module/module-metadata.js';

export const routingMetadata: FeatureModuleDecorator = makeClassDecorator(transformModule);

export interface FeatureModuleDecorator {
  (data?: RoutingMetadata): any;
}

export function transformModule(data?: RoutingMetadata): RawMeta {
  const metadata = Object.assign({}, data);
  objectKeys(metadata).forEach((p) => {
    // If here is object with [Symbol.iterator]() method, this transform it to an array.
    if (metadata[p] instanceof Providers) {
      (metadata as any)[p] = [...metadata[p]];
    }
  });
  return { decorator: routingMetadata, declaredInDir: CallsiteUtils.getCallerDir(), ...metadata };
}

/**
 * Raw module metadata returned by reflector.
 */
export interface RawMeta extends RoutingMetadata {
  decorator: AnyFn;
  declaredInDir: string;
  /**
   * An array of pairs, each of which is in the first place the provider's token,
   * and in the second - the module from which to import the provider with the specified token.
   */
  resolvedCollisionsPerApp?: [any, ModuleType | BaseModuleWithParams][];
}
