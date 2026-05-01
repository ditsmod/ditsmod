import { XOasObject, openapi } from '@ts-stack/openapi-spec';

export const oasObject: XOasObject = {
  openapi,
  info: { title: 'Testing @ditsmod/openapi', version: '1.0.0' },
  tags: [
    {
      name: 'NonOasRoutes',
      description:
        'Routes that used `@route()` decorator. If you want to change this description, ' +
        '[use tags](https://swagger.io/docs/specification/grouping-operations-with-tags/) ' +
        'for `@oasRoute()` imported from @ditsmod/openapi.',
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
