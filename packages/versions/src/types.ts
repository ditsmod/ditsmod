import { Extension } from '@ditsmod/core';
import { InjectionToken } from '@ts-stack/di';

export const API_VERSIONS_EXTENSIONS = new InjectionToken<Extension<void>[]>('API_VERSIONS_EXTENSIONS');
