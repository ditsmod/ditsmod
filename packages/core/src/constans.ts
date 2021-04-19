import { InjectionToken } from '@ts-stack/di';

import { AppMetadataMap } from './types/mix';
import { VOID_EXTENSIONS, ROUTES_EXTENSIONS } from './types/extension';

export const APP_METADATA_MAP = new InjectionToken<AppMetadataMap>('APP_METADATA_MAP');
export const defaultExtensions: InjectionToken<any>[] = [ROUTES_EXTENSIONS, VOID_EXTENSIONS];
