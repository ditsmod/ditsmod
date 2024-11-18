import { makeClassDecorator } from '#di';
import { ModuleMetadata } from '#types/module-metadata.js';
import { Scope } from '#types/mix.js';

const scopes = ['App', 'Mod', 'Rou', 'Req'] as Scope[];

export const featureModule = makeClassDecorator(transformModule);

export function transformModule(data?: ModuleMetadata) {
  const metadata = Object.assign({}, data);
  scopes.forEach((scope) => {
    // If here is object with [Symbol.iterator]() method, this transform it to an array.
    const arr = [...(data?.[`providersPer${scope}`] || [])];
    if (arr.length) {
      metadata[`providersPer${scope}`] = arr;
    }
  });
  return metadata;
}
