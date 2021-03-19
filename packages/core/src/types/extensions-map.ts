import { ExtensionMetadata } from './extension-metadata';
import { ModuleType } from './module-type';
import { ModuleWithParams } from './module-with-params';

export type ExtensionsMap = Map<ModuleType | ModuleWithParams, ExtensionMetadata>;