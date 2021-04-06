import { InjectionToken } from '@ts-stack/di';

import { ExtensionMetadata } from './extension-metadata';
import { ModuleType } from './mix';
import { ModuleWithParams } from './module-with-params';

export type ExtensionsMap = Map<ModuleType | ModuleWithParams, ExtensionMetadata>;
export const EXTENSIONS_MAP = new InjectionToken<ExtensionsMap>('EXTENSIONS_MAP');