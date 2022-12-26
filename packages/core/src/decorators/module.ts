import { makeClassDecorator } from '@ts-stack/di';

import { ModuleMetadata } from '../types/module-metadata';

export const featureModule = makeClassDecorator((data: ModuleMetadata) => data || {});
