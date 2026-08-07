import { InjectionToken } from '@holu/core';

import type { TypeormAsyncOptionsDescriptor, TypeormModuleOptions } from './types.js';

export const DEFAULT_DATA_SOURCE_NAME = 'default';
export const TYPEORM_OPTIONS = new InjectionToken<TypeormModuleOptions[]>('TYPEORM_OPTIONS');
export const TYPEORM_ASYNC_OPTIONS = new InjectionToken<TypeormAsyncOptionsDescriptor[]>('TYPEORM_ASYNC_OPTIONS');
