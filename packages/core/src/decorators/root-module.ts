import { DecoratorWithGuard, makeClassDecorator } from '#di';
import { AnyFn } from '#types/mix.js';
import { RootModuleMetadata } from '#types/root-module-metadata.js';
import { transformModule } from './feature-module.js';

export const rootModule: RootModuleDecorator = makeClassDecorator(
  function transformRootModule(data?: RootModuleMetadata) {
    const rawMeta = transformModule(data);
    rawMeta.decorator = rootModule;
    return rawMeta;
  },
  undefined,
  'rootModule',
);

export interface RootModuleDecorator extends DecoratorWithGuard<AnyFn, RootModuleMetadata> {
  (data?: RootModuleMetadata): any;
}
