import { makeClassDecorator } from '#di';
import { ModuleMetadata, ModuleWithParams, ModuleWithSrcInitMeta } from '#types/module-metadata.js';
import { AnyFn, ModRefId, ModuleType, Override } from '#types/mix.js';
import { objectKeys } from '#utils/object-keys.js';
import { Providers } from '#utils/providers.js';
import { CallsiteUtils } from '#utils/callsites.js';

export const featureModule: FeatureModuleDecorator = makeClassDecorator(transformModule);

export interface FeatureModuleDecorator {
  (data?: ModuleMetadata): any;
}
export interface InitImports<T extends { modRefId: ModRefId } = { modRefId: ModRefId }> {
  importsModules?: ModuleType[];
  importsWithParams?: Override<T, { modRefId: ModuleWithSrcInitMeta }>[];
}

export function transformModule(data?: ModuleMetadata): RawMeta {
  const rawMeta = Object.assign({}, data) as RawMeta;
  objectKeys(rawMeta).forEach((p) => {
    if (rawMeta[p] instanceof Providers) {
      (rawMeta as any)[p] = [...rawMeta[p]];
    } else if (Array.isArray(rawMeta[p])) {
      (rawMeta as any)[p] = rawMeta[p].slice();
    }
  });

  rawMeta.decorator = featureModule;
  rawMeta.declaredInDir = CallsiteUtils.getCallerDir() || '.';
  return rawMeta;
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
