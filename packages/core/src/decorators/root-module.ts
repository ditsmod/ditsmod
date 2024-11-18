import { makeClassDecorator } from '#di';
import { RootModuleMetadata } from '#types/root-module-metadata.js';
import { ModuleMetadataWithContext, transformModule } from './module.js';

export const rootModule = makeClassDecorator((data?: RootModuleMetadata): ModuleMetadataWithContext => {
  const metadata = transformModule(data);
  metadata.decorator = rootModule as any;
  return metadata;
});
