import { FeatureModuleOptions } from '#decorators/module-decorator-options.js';
import { Reflector } from '#di/reflector.js';
import { objectKeys } from '#utils/object-keys.js';
import { ProviderBuilder } from '#utils/providers.js';

export const featureModule: FeatureModuleDecorator = Reflector.makeClassDecorator(transformModule, 'featureModule');

export interface FeatureModuleDecorator {
  (data?: FeatureModuleOptions): any;
}

function transformModule(data?: FeatureModuleOptions): FeatureModuleOptions {
  const moduleOptions = Object.assign(new FeatureModuleOptions(), data);
  objectKeys(moduleOptions).forEach((p) => {
    if (moduleOptions[p] instanceof ProviderBuilder) {
      (moduleOptions as any)[p] = [...moduleOptions[p]];
    } else if (Array.isArray(moduleOptions[p])) {
      (moduleOptions as any)[p] = moduleOptions[p].slice();
    }
  });

  return moduleOptions;
}
