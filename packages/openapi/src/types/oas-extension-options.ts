import type { XOasObject } from '@ts-stack/openapi-spec';
import type { SwaggerOAuthOptions } from '../swagger-ui/o-auth-options.js';
import { getSymbol } from '@ditsmod/core';

/**
 * Internaly used options.
 */
export class OasExtensionConfig {
  oasObject?: XOasObject;
  swaggerOAuthOptions?: SwaggerOAuthOptions;
}

export interface OasConfigFiles {
  json: string;
  yaml: string;
}

export const OAS_CONFIG_FILES = getSymbol<OasConfigFiles>();
