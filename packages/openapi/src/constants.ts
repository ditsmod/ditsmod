import { deepFreeze } from '@ditsmod/core';
import { openapi, XOasObject } from '@ts-stack/openapi-spec';

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

deepFreeze(DEFAULT_OAS_OBJECT);
