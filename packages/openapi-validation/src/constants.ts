import { InjectionToken } from '@ditsmod/core';
import { Options } from 'ajv';

/**
 * Ajv JSON schema validator options, see [docs](https://ajv.js.org/) for more info.
 */
export const AJV_OPTIONS = new InjectionToken<Options>('AJV_OPTIONS');
