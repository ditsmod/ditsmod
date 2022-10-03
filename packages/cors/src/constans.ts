import { Extension } from '@ditsmod/core';
import { InjectionToken } from '@ts-stack/di';

export const CORS_EXTENSIONS = new InjectionToken<Extension<void>[]>('CORS_EXTENSIONS');
