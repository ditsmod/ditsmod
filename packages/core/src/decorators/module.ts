import { makeClassDecorator } from '../di/index.js';
import { ModuleMetadata } from '../types/module-metadata.js';

export const featureModule = makeClassDecorator((data?: ModuleMetadata) => data || {});
