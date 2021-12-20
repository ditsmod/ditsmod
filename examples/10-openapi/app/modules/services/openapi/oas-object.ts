import { XOasObject } from '@ts-stack/openapi-spec';

export const oasObject: XOasObject = {
  openapi: '3.0.0',
  // Here works the servers that are described using this OpenAPI documentation.
  servers: [{ url: 'http://localhost:3000' }],
  info: { title: 'Testing @ditsmod/openapi', version: '1.0.0' },
  tags: [
    {
      name: 'NonOasRoutes',
      description:
        'Routes that used `@Route()` decorator. If you want to change this description, ' +
        '[use tags](https://swagger.io/docs/specification/grouping-operations-with-tags/) ' +
        'for `@OasRoute()` imported from @ditsmod/openapi.',
    },
    {
      name: 'withParameter',
      description: 'Parameter in path.',
    },
    {
      name: 'withBasicAuth',
      description: 'Here you need username and password.',
    },
  ],
  components: {
    responses: {
      UnauthorizedError: {
        description: 'Authentication information is missing or invalid',
        headers: {
          WWW_Authenticate: {
            schema: { type: 'string' },
            description:
              'Taken from [swagger.io](https://swagger.io/docs/specification/authentication/basic-authentication/)',
          },
        },
      },
    },
  },
};
