import { ModuleDecoratorOptions } from '#decorators/module-decorator-options.js';
import { Reflector } from '#di/reflector.js';
import { objectKeys } from '#utils/object-keys.js';
import { Providers } from '#utils/providers.js';

export const featureModule: FeatureModuleDecorator = Reflector.makeClassDecorator(transformModule, 'featureModule');

export interface FeatureModuleDecorator {
  (data?: ModuleDecoratorOptions): any;
}

function transformModule(data?: ModuleDecoratorOptions): ModuleDecoratorOptions {
  const decoratorOptions = Object.assign(new ModuleDecoratorOptions(), data);
  objectKeys(decoratorOptions).forEach((p) => {
    if (decoratorOptions[p] instanceof Providers) {
      (decoratorOptions as any)[p] = [...decoratorOptions[p]];
    } else if (Array.isArray(decoratorOptions[p])) {
      (decoratorOptions as any)[p] = decoratorOptions[p].slice();
    }
  });

  return decoratorOptions;
}
