import { XOasObject } from '@ts-stack/openapi-spec';

export const oasObject: XOasObject = {
  openapi: '3.0.0',
  // Here works the servers that are described using this OpenAPI documentation.
  servers: [{ url: 'http://localhost:8080' }],
  info: { title: 'Testing @ditsmod/openapi', version: '1.0.0' },
  tags: [
    {
      name: 'tag1',
      description: 'Some description for tag1',
    },
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
    headers: {},
    schemas: {},
    examples: {},
  },
};
