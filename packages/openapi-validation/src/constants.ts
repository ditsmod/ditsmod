import { Extension } from '@ditsmod/core';
import { InjectionToken } from '@ts-stack/di';

/**
 * A group of extensions that validates input request parameters.
 */
 export const VALIDATION_EXTENSIONS = new InjectionToken<Extension<void>[]>('VALIDATION_EXTENSIONS');
 