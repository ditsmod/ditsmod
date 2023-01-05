import { makeClassDecorator } from '../di';

import { ModuleMetadata } from '../types/module-metadata';

export const featureModule = makeClassDecorator((data: ModuleMetadata) => data || {});
