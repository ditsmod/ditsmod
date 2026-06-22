import { Reflector } from '#di/reflector.js';
import type { RootModuleMetadata } from '#types/root-module-metadata.js';
import { objectKeys } from '#utils/object-keys.js';
import { Providers } from '#utils/providers.js';
import { RootRawMetadata } from './module-raw-metadata.js';

export const rootModule: RootModuleDecorator = Reflector.makeClassDecorator(transformModule, 'rootModule');

export interface RootModuleDecorator {
  (data?: RootModuleMetadata): any;
}

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
