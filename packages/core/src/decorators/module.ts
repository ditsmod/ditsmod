import { makeClassDecorator } from '#di';
import { ModuleMetadata } from '#types/module-metadata.js';

export const featureModule = makeClassDecorator((data?: ModuleMetadata) => {
  return data || {};
});
