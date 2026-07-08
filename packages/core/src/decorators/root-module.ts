import type { ForwardRefFn } from '#di/forward-ref.js';
import type { ModRefId, ModuleType } from '#types/mix.js';
import { Reflector } from '#di/reflector.js';
import { objectKeys } from '#utils/object-keys.js';
import { Providers } from '#utils/providers.js';
import { ModuleRawMetadata } from './module-raw-metadata.js';

/**
 * Raw module metadata returned by reflector.
 */
export class RootDecoratorOptions extends ModuleRawMetadata {
  /**
   * An array of pairs, each of which is in the first place the provider's token,
   * and in the second - the module from which to import the provider with the specified token.
   */
  declare resolvedCollisionPerApp?: [any, ModRefId | ForwardRefFn<ModuleType>][];
}

export const rootModule: RootModuleDecorator = Reflector.makeClassDecorator(transformModule, 'rootModule');

export interface RootModuleDecorator {
  (data?: RootDecoratorOptions): any;
}

function transformModule(data?: RootDecoratorOptions): RootDecoratorOptions {
  const rawMeta = Object.assign(new RootDecoratorOptions(), data) as RootDecoratorOptions;
  objectKeys(rawMeta).forEach((p) => {
    if (rawMeta[p] instanceof Providers) {
      (rawMeta as any)[p] = [...rawMeta[p]];
    } else if (Array.isArray(rawMeta[p])) {
      (rawMeta as any)[p] = rawMeta[p].slice();
    }
  });

  return rawMeta;
}
