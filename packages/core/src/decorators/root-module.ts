import { makeClassDecorator } from '#di';
import { RootModuleMetadata } from '#types/root-module-metadata.js';
import { objectKeys } from '#utils/object-keys.js';
import { Providers } from '#utils/providers.js';
import { RootRawMetadata } from './module-raw-metadata.js';

function transformModule(data?: RootRawMetadata): RootRawMetadata {
  const rawMeta = Object.assign(new RootRawMetadata(), data) as RootRawMetadata;
  objectKeys(rawMeta).forEach((p) => {
    if (rawMeta[p] instanceof Providers) {
      (rawMeta as any)[p] = [...rawMeta[p]];
    } else if (Array.isArray(rawMeta[p])) {
      (rawMeta as any)[p] = rawMeta[p].slice();
    }
  });

  return rawMeta;
}

export const rootModule: RootModuleDecorator = makeClassDecorator(function transformRootModule(
  data?: RootModuleMetadata,
) {
  const rawMeta = transformModule(data);
  return rawMeta;
}, 'rootModule');

export interface RootModuleDecorator {
  (data?: RootModuleMetadata): any;
}
