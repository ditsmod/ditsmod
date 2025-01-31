import { makeClassDecorator } from '#di';
import { RootModuleMetadata } from '#types/root-module-metadata.js';
import { transformModule } from './feature-module.js';

export const rootModule: RootModuleDecorator = makeClassDecorator(function transformRootModule(
  data?: RootModuleMetadata,
) {
  const attachedMetadata = transformModule(data);
  attachedMetadata.metadata.decorator = rootModule;
  return attachedMetadata;
});

export interface RootModuleDecorator {
  (data?: RootModuleMetadata): any;
}
