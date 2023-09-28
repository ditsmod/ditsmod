import { Extension, InjectionToken } from '@ditsmod/core';

export const API_VERSIONS_EXTENSIONS = new InjectionToken<Extension<void>[]>('API_VERSIONS_EXTENSIONS');
