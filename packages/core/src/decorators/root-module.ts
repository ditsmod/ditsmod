import type { ForwardRefFn } from '#di/forward-ref.js';
import type { ModRefId, ModuleType } from './module-decorator-options.js';
import { Reflector } from '#di/reflector.js';
import { objectKeys } from '#utils/object-keys.js';
import { ProviderBuilder } from '#utils/providers.js';
import { ModuleDecoratorOptions } from './module-decorator-options.js';

/**
 * Raw module metadata returned by reflector.
 */
export class RootDecoratorOptions extends ModuleDecoratorOptions {
  /**
   * An array of pairs, each of which is in the first place the provider's token,
   * and in the second - the module from which to import the provider with the specified token.
   */
  declare resolvedCollisionsPerApp?: [any, ModRefId | ForwardRefFn<ModuleType>][];
}

export const rootModule: RootModuleDecorator = Reflector.makeClassDecorator(transformModule, 'rootModule');

export interface RootModuleDecorator {
  (data?: RootDecoratorOptions): any;
}

function transformModule(data?: RootDecoratorOptions): RootDecoratorOptions {
  const decoratorOptions = Object.assign(new RootDecoratorOptions(), data) as RootDecoratorOptions;
  objectKeys(decoratorOptions).forEach((p) => {
    if (decoratorOptions[p] instanceof ProviderBuilder) {
      (decoratorOptions as any)[p] = [...decoratorOptions[p]];
    } else if (Array.isArray(decoratorOptions[p])) {
      (decoratorOptions as any)[p] = decoratorOptions[p].slice();
    }
  });

  return decoratorOptions;
}
