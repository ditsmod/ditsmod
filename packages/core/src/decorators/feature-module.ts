import { DecoratorAndValue, makeClassDecorator } from '#di';
import { ModuleMetadata, ModuleWithParams } from '#types/module-metadata.js';
import { AnyFn, AnyObj, ModuleType, Override } from '#types/mix.js';
import { objectKeys } from '#utils/object-keys.js';
import { Providers } from '#utils/providers.js';
import { CallsiteUtils } from '#utils/callsites.js';
import { mergeArrays } from '#utils/merge-arrays.js';

export const featureModule: FeatureModuleDecorator = makeClassDecorator(transformModule);

export interface FeatureModuleDecorator {
  (data?: ModuleMetadata): any;
}

function mergeModuleWithParams(modWitParams: ModuleWithParams, decorAndVal: DecoratorAndValue<AttachedMetadata>) {
  const rawMeta = Object.assign({}, decorAndVal.value.metadata) as RawMeta;
  if (modWitParams.id) {
    rawMeta.id = modWitParams.id;
  }
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

    rawMeta.extensionsMeta = { ...rawMeta.extensionsMeta, ...param.metadata.extensionsMeta };
  }
  return rawMeta;
}

export function transformModule(data?: ModuleMetadata): Override<AttachedMetadata, { metadata: RawMeta }> {
  const metadata = Object.assign({}, data) as RawMeta;
  objectKeys(metadata).forEach((p) => {
    // If here is object with [Symbol.iterator]() method, this transform it to an array.
    if (metadata[p] instanceof Providers) {
      (metadata as any)[p] = [...metadata[p]];
    }
  });
  metadata.decorator = featureModule;
  metadata.declaredInDir = CallsiteUtils.getCallerDir() || '.';
  return { isAttachedMetadata: true, metadata, mergeModuleWithParams };
}
/**
 * A metadata attached to the `rootModule` or `featureModule` decorators.
 */
export interface AttachedMetadata {
  isAttachedMetadata: true;
  metadata: AnyObj;
  mergeModuleWithParams?: (modWitParams: ModuleWithParams, decorAndVal: DecoratorAndValue<AttachedMetadata>) => AnyObj;
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
