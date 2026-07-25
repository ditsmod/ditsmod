import { InjectionToken } from '@ditsmod/core';

import type { TypeormModuleOptions } from './types.js';

export const DEFAULT_DATA_SOURCE_NAME = 'default';
export const TYPEORM_OPTIONS = new InjectionToken<TypeormModuleOptions[]>('TYPEORM_OPTIONS');
