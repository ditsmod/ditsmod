import { makeClassDecorator } from '#di';
import { ModuleMetadata, ModuleWithParams } from '#types/module-metadata.js';
import { AnyFn, ModuleType } from '#types/mix.js';
import { CallsiteUtils } from '#utils/callsites.js';
import { objectKeys } from '#utils/object-keys.js';
import { Providers } from '#utils/providers.js';

export const featureModule: FeatureModuleDecorator = makeClassDecorator(transformModule);

export interface FeatureModuleDecorator {
  (data?: ModuleMetadata): any;
}

export function transformModule(data?: ModuleMetadata): RawMeta {
  const metadata = Object.assign({}, data);
  objectKeys(metadata).forEach((p) => {
    // If here is object with [Symbol.iterator]() method, this transform it to an array.
    if (metadata[p] instanceof Providers) {
      (metadata as any)[p] = [...metadata[p]];
    }
  });
  return { decorator: featureModule, declaredInDir: CallsiteUtils.getCallerDir(), ...metadata };
}

/**
 * Raw module metadata returned by reflector.
 */
export interface RawMeta extends ModuleMetadata {
  decorator: AnyFn;
  declaredInDir: string;
  /**
   * An array of pairs, each of which is in the first place the provider's token,
   * and in the second - the module from which to import the provider with the specified token.
   */
  resolvedCollisionsPerApp?: [any, ModuleType | ModuleWithParams][];
}
