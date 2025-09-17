import { makeClassDecorator } from '#di';
import { ModuleRawMetadata } from '#decorators/module-raw-metadata.js';
import { objectKeys } from '#utils/object-keys.js';
import { Providers } from '#utils/providers.js';

export const featureModule: FeatureModuleDecorator = makeClassDecorator(transformModule, 'featureModule');

export interface FeatureModuleDecorator {
  (data?: ModuleRawMetadata): any;
}

export function transformModule(data?: ModuleRawMetadata): ModuleRawMetadata {
  const rawMeta = Object.assign(new ModuleRawMetadata(), data) as ModuleRawMetadata;
  objectKeys(rawMeta).forEach((p) => {
    if (rawMeta[p] instanceof Providers) {
      (rawMeta as any)[p] = [...rawMeta[p]];
    } else if (Array.isArray(rawMeta[p])) {
      (rawMeta as any)[p] = rawMeta[p].slice();
    }
  });

  return rawMeta;
}
