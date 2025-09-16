import { ForwardRefFn, makeClassDecorator } from '#di';
import { ModuleMetadata } from '#types/module-metadata.js';
import { ModRefId, ModuleType } from '#types/mix.js';
import { objectKeys } from '#utils/object-keys.js';
import { Providers } from '#utils/providers.js';

export const featureModule: FeatureModuleDecorator = makeClassDecorator(transformModule, 'featureModule');

export interface FeatureModuleDecorator {
  (data?: ModuleMetadata): any;
}

export function transformModule(data?: ModuleMetadata): RawMeta {
  const rawMeta = Object.assign(new RawMeta(), data) as RawMeta;
  objectKeys(rawMeta).forEach((p) => {
    if (rawMeta[p] instanceof Providers) {
      (rawMeta as any)[p] = [...rawMeta[p]];
    } else if (Array.isArray(rawMeta[p])) {
      (rawMeta as any)[p] = rawMeta[p].slice();
    }
  });

  return rawMeta;
}
/**
 * Raw module metadata returned by reflector.
 */
export class RawMeta extends ModuleMetadata {
  /**
   * An array of pairs, each of which is in the first place the provider's token,
   * and in the second - the module from which to import the provider with the specified token.
   */
  resolvedCollisionsPerApp?: [any, ModRefId | ForwardRefFn<ModuleType>][];
}
