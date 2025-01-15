import { makeClassDecorator } from '#di';
import { RootModuleMetadata } from '#types/root-module-metadata.js';
import { RawMeta, transformModule } from './module.js';

export const rootModule: RootModuleDecorator = makeClassDecorator(function transformRootModule(
  data?: RootModuleMetadata,
): RawMeta {
  const metadata = transformModule(data);
  metadata.decorator = rootModule as any;
  return metadata;
});

export interface RootModuleDecorator {
  <T extends RootModuleMetadata = {}>(data?: T): any;
}
