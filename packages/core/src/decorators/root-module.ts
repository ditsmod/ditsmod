import { makeClassDecorator } from '#di';
import { ModuleMetadata } from '#types/module-metadata.js';
import { RootModuleMetadata } from '#types/root-module-metadata.js';
import { getCallerDir } from '#utils/callsites.js';
import { ModuleMetadataValue } from '#utils/get-module-metadata.js';

export const rootModule = makeClassDecorator((data: Omit<ModuleMetadata, 'id'> & RootModuleMetadata) => {
  return { data, declaredInDir: getCallerDir() } as ModuleMetadataValue;
});
