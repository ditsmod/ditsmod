import { makeClassDecorator } from '#di';
import { ModuleMetadata } from '#types/module-metadata.js';
import { getCallerDir } from '#utils/callsites.js';
import { ModuleMetadataValue } from '#utils/get-module-metadata.js';

export const featureModule = makeClassDecorator((data?: ModuleMetadata) => {
  data ??= {};
  return { data, declaredInDir: getCallerDir() } as ModuleMetadataValue;
});
