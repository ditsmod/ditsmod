import { InjectionToken } from '@ts-stack/di';

import { ExtensionMetadata } from './extension-metadata';
import { ModuleType, ModuleWithParams } from './mix';

export type AppMetadataMap = Map<ModuleType | ModuleWithParams, ExtensionMetadata>;
export const APP_METADATA_MAP = new InjectionToken<AppMetadataMap>('APP_METADATA_MAP');