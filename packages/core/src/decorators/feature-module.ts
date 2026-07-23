import { FeatureModuleOptions } from '#decorators/module-decorator-options.js';
import { Reflector } from '#di/reflector.js';
import { objectKeys } from '#utils/object-keys.js';
import { ProviderBuilder } from '#utils/providers.js';

export const featureModule: FeatureModuleDecorator = Reflector.makeClassDecorator(transformModule, 'featureModule');

export interface FeatureModuleDecorator {
  (data?: FeatureModuleOptions): any;
}

function transformModule(data?: FeatureModuleOptions): FeatureModuleOptions {
  const decoratorOptions = Object.assign(new FeatureModuleOptions(), data);
  objectKeys(decoratorOptions).forEach((p) => {
    if (decoratorOptions[p] instanceof ProviderBuilder) {
      (decoratorOptions as any)[p] = [...decoratorOptions[p]];
    } else if (Array.isArray(decoratorOptions[p])) {
      (decoratorOptions as any)[p] = decoratorOptions[p].slice();
    }
  });

  return decoratorOptions;
}
