import { makeClassDecorator } from '@ts-stack/di';

import { ModuleMetadata } from '../types/module-metadata';

export const mod = makeClassDecorator((data: ModuleMetadata) => data || {});
