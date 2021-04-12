import { InjectionToken } from '@ts-stack/di';

import { MetadataPerMod } from './metadata-per-mod';
import { ModuleType, ModuleWithParams } from './mix';

export type AppMetadataMap = Map<ModuleType | ModuleWithParams, MetadataPerMod>;
export const APP_METADATA_MAP = new InjectionToken<AppMetadataMap>('APP_METADATA_MAP');