import { XOasObject, openapi } from '@ts-stack/openapi-spec';

export const oasObject: XOasObject = {
  openapi,
  // Here works the servers that are described using this OpenAPI documentation.
  servers: [{ url: 'http://localhost:3000' }],
  info: { title: 'Testing @ditsmod/openapi-validation', version: '1.0.0' },
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
