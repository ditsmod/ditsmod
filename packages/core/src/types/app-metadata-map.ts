import { InjectionToken } from '@ts-stack/di';

import { AppMetadata } from './app-metadata';
import { ModuleType, ModuleWithParams } from './mix';

export type AppMetadataMap = Map<ModuleType | ModuleWithParams, AppMetadata>;
export const APP_METADATA_MAP = new InjectionToken<AppMetadataMap>('APP_METADATA_MAP');