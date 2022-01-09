import { deepFreeze } from '@ditsmod/core';
import { openapi, XOasObject } from '@ts-stack/openapi-spec';

export const DEFAULT_OAS_OBJECT: XOasObject = {
  openapi,
  servers: [{ url: 'http://localhost:3000' }],
  info: { title: 'Testing @ditsmod/openapi with default value', version: '0.0.0' },
  tags: [],
  components: {}
};

deepFreeze(DEFAULT_OAS_OBJECT);
