import { makeClassDecorator } from '#di';
import { RootModuleMetadata } from '#types/root-module-metadata.js';
import { transformModule } from './feature-module.js';

export const rootModule: RootModuleDecorator = makeClassDecorator(function transformRootModule(
  data?: RootModuleMetadata,
) {
  const perModAttachedMetadata = transformModule(data);
  perModAttachedMetadata.metadata.decorator = rootModule;
  return perModAttachedMetadata;
});

export interface RootModuleDecorator {
  (data?: RootModuleMetadata): any;
}
