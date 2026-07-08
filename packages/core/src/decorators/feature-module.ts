import { ModuleDecoratorOptions } from '#decorators/module-decorator-options.js';
import { Reflector } from '#di/reflector.js';
import { objectKeys } from '#utils/object-keys.js';
import { Providers } from '#utils/providers.js';

export const featureModule: FeatureModuleDecorator = Reflector.makeClassDecorator(transformModule, 'featureModule');

export interface FeatureModuleDecorator {
  (data?: ModuleDecoratorOptions): any;
}

function transformModule(data?: ModuleDecoratorOptions): ModuleDecoratorOptions {
  const rawMeta = Object.assign(new ModuleDecoratorOptions(), data);
  objectKeys(rawMeta).forEach((p) => {
    if (rawMeta[p] instanceof Providers) {
      (rawMeta as any)[p] = [...rawMeta[p]];
    } else if (Array.isArray(rawMeta[p])) {
      (rawMeta as any)[p] = rawMeta[p].slice();
    }
  });

  return rawMeta;
}
