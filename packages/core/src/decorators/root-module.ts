import { makeClassDecorator } from '#di';
import { RootModuleMetadata } from '#types/root-module-metadata.js';

export const rootModule = makeClassDecorator((data: RootModuleMetadata) => {
  return data || {};
});
