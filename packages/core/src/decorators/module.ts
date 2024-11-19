import { makeClassDecorator } from '#di';
import { ModuleMetadata, ModuleWithParams } from '#types/module-metadata.js';
import { AnyFn, GuardItem, ModuleType, Scope } from '#types/mix.js';
import { getCallerDir } from '#utils/callsites.js';

const scopes = ['App', 'Mod', 'Rou', 'Req'] as Scope[];

export const featureModule = makeClassDecorator(transformModule);

export function transformModule(data?: ModuleMetadata): ExtendedModuleMetadata {
  const metadata = Object.assign({}, data);
  scopes.forEach((scope) => {
    // If here is object with [Symbol.iterator]() method, this transform it to an array.
    const arr = [...(data?.[`providersPer${scope}`] || [])];
    if (arr.length) {
      metadata[`providersPer${scope}`] = arr;
    }
  });
  return { decorator: featureModule, declaredInDir: getCallerDir(), guards: [], ...metadata };
}

export interface ExtendedModuleMetadata extends ModuleMetadata {
  decorator: AnyFn;
  declaredInDir: string;
  guards: GuardItem[];
  /**
   * An array of pairs, each of which is in the first place the provider's token,
   * and in the second - the module from which to import the provider with the specified token.
   */
  resolvedCollisionsPerApp?: [any, ModuleType | ModuleWithParams][];
}
