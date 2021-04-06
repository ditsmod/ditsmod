import { InjectionToken } from '@ts-stack/di';

import { DEFAULT_EXTENSIONS, ROUTES_EXTENSIONS } from '../types/extension';

export const defaultExtensions: InjectionToken<any>[] = [DEFAULT_EXTENSIONS, ROUTES_EXTENSIONS];
