import type { OasGuardMeta } from '#decorators/oas-guard.js';
import { HttpStatus } from '@ditsmod/core';
import type { XOasObject } from '@ts-stack/openapi-spec';
import { openapi } from '@ts-stack/openapi-spec';

/**
 * Used inside OpenAPI models to indicates whether requestBody property is required or not.
 */
export const REQUIRED = 'x-required';

export const DEFAULT_OAS_OBJECT: XOasObject = {
  openapi,
  servers: [{ url: 'http://0.0.0.0:3000' }],
  info: { title: '@ditsmod/openapi with default value', version: '0.0.0' },
  tags: [],
  components: {},
};

export const defaultForNonOasGuard: OasGuardMeta = {
  securitySchemeObject: {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description:
      'See docs for [Bearer Authentication](https://swagger.io/docs/specification/authentication/bearer-authentication/)',
  },
  responses: {
    [HttpStatus.UNAUTHORIZED]: {
      $ref: '#/components/responses/UnauthorizedError',
    },
  },
};
