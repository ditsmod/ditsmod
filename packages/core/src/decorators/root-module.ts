import { makeClassDecorator } from '#di';
import { RootModuleMetadata } from '#types/root-module-metadata.js';
import { transformModule } from './feature-module.js';

export const rootModule: RootModuleDecorator = makeClassDecorator(function transformRootModule(
  data?: RootModuleMetadata,
) {
  const initHooksAndMetadata = transformModule(data);
  initHooksAndMetadata.rawMeta.decorator = rootModule;
  return initHooksAndMetadata;
});

export interface RootModuleDecorator {
  (data?: RootModuleMetadata): any;
}
