import { HttpMethod, edk } from '@ditsmod/core';
import { openapi, XOasObject } from '@ts-stack/openapi-spec';

export const DEFAULT_OAS_OBJECT: XOasObject = {
  openapi,
  servers: [{ url: 'http://localhost:8080' }],
  info: { title: 'Testing @ditsmod/openapi with default value', version: '0.0.0' },
  tags: [
    {
      name: 'OasDocs',
      description: 'Routes used to service OpenAPI documentation',
    },
    {
      name: 'NonOasRoutes',
      description:
        'Routes that use a decorator `@Route()`. If you want to change this description, ' +
        '[use tags](https://swagger.io/docs/specification/grouping-operations-with-tags/) ' +
        'for `@OasRoute()` imported from @ditsmod/openapi.',
    },
  ],
  components: {
    securitySchemes: {}
  }
};

edk.deepFreeze(DEFAULT_OAS_OBJECT);
