import { InjectionToken } from '@ts-stack/di';
import { AppMetadataMap } from './types/mix';

export const APP_METADATA_MAP = new InjectionToken<AppMetadataMap>('APP_METADATA_MAP');
