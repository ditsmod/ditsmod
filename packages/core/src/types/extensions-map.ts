import { InjectionToken } from '@ts-stack/di';

import { ExtensionMetadata } from './extension-metadata';
import { ModuleType, ModuleWithParams } from './mix';

export type ExtensionsMap = Map<ModuleType | ModuleWithParams, ExtensionMetadata>;
export const EXTENSIONS_MAP = new InjectionToken<ExtensionsMap>('EXTENSIONS_MAP');