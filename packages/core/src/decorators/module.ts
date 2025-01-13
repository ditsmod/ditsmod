import { makeClassDecorator } from '#di';
import { ModuleMetadata, ModuleWithParams } from '#types/module-metadata.js';
import { AnyFn, ModuleType } from '#types/mix.js';
import { CallsiteUtils } from '#utils/callsites.js';

const levels = ['App', 'Mod'] as const;

export const featureModule: FeatureModuleDecorator = makeClassDecorator(transformModule);

export interface FeatureModuleDecorator {
  <T extends object = {}>(data?: ModuleMetadata & T): any;
}

export function transformModule(data?: ModuleMetadata): RawMeta {
  const metadata = Object.assign({}, data);
  levels.forEach((lvl) => {
    // If here is object with [Symbol.iterator]() method, this transform it to an array.
    const arr = [...(data?.[`providersPer${lvl}`] || [])];
    if (arr.length) {
      metadata[`providersPer${lvl}`] = arr;
    }
  });
  return {
    //
    decorator: featureModule,
    declaredInDir: CallsiteUtils.getCallerDir(),
    // guards: [],
    ...metadata,
  };
}

/**
 * Raw module metadata returned by reflector.
 */
export interface RawMeta extends ModuleMetadata {
  decorator: AnyFn;
  declaredInDir: string;
  // guards: GuardItem[];
  /**
   * An array of pairs, each of which is in the first place the provider's token,
   * and in the second - the module from which to import the provider with the specified token.
   */
  resolvedCollisionsPerApp?: [any, ModuleType | ModuleWithParams][];
}
