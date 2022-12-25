import { makeClassDecorator } from '@ts-stack/di';

import { ModuleMetadata } from '../types/module-metadata';
import { RootModuleMetadata } from '../types/root-module-metadata';

export const rootModule = makeClassDecorator((data: Omit<ModuleMetadata, 'id'> & RootModuleMetadata) => data);
