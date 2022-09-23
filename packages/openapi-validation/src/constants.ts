import { Extension } from '@ditsmod/core';
import { InjectionToken } from '@ts-stack/di';
import { Options } from 'ajv';

/**
 * A group of extensions that validates input request parameters.
 */
export const VALIDATION_EXTENSIONS = new InjectionToken<Extension<void>[]>('VALIDATION_EXTENSIONS');

/**
 * Ajv JSON schema validator options, see [docs](https://ajv.js.org/) for more info.
 */
export const AJV_OPTIONS = new InjectionToken<Options>('AJV_OPTIONS');
