import { makeClassDecorator } from '#di';
import { RootModuleMetadata } from '#types/root-module-metadata.js';
import { RawMeta, transformModule } from './module.js';

export const rootModule = makeClassDecorator((data?: RootModuleMetadata): RawMeta => {
  const metadata = transformModule(data);
  metadata.decorator = rootModule as any;
  return metadata;
});
