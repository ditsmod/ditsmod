import { XOasObject } from '@ts-stack/openapi-spec';

/**
 * Internaly used options.
 */
export class OasExtensionOptions {
  oasObject?: XOasObject;
}

export class OasConfigFiles {
  json: string;
  yaml: string;
}
