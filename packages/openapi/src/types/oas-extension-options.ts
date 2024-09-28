import { XOasObject } from '@ts-stack/openapi-spec';
import { SwaggerOAuthOptions } from '../swagger-ui/o-auth-options.js';

/**
 * Internaly used options.
 */
export class OasExtensionOptions {
  oasObject?: XOasObject;
  swaggerOAuthOptions?: SwaggerOAuthOptions;
}

export class OasConfigFiles {
  json: string;
  yaml: string;
}
