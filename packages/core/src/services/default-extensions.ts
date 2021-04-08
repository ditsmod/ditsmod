import { InjectionToken } from '@ts-stack/di';

import { VOID_EXTENSIONS, ROUTES_EXTENSIONS } from '../types/extension';

export const defaultExtensions: InjectionToken<any>[] = [ROUTES_EXTENSIONS, VOID_EXTENSIONS];
