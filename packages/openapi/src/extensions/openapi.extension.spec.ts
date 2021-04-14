import 'reflect-metadata';
import { HttpMethod, Status } from '@ditsmod/core';
import { XPathItemObject } from '@ts-stack/openapi-spec';

import { OpenapiExtension } from './openapi.extension';

describe('OpenapiExtension', () => {
  class MockOpenapiExtension extends OpenapiExtension {
    mergeParams(pathItem: XPathItemObject, httpMethod: HttpMethod) {
      return super.mergeParams(pathItem, httpMethod);
    }
  }

  let mock: MockOpenapiExtension;
  beforeEach(() => {
    mock = new MockOpenapiExtension(null, null, null);
  });

  it('mergeParams()', () => {
    const pathItem: XPathItemObject = {
      parameters: [{ in: 'query', name: 'catId' }],
      get: {
        parameters: [
          { in: 'query', name: 'rubricId' },
          { in: 'query', name: 'contextId' },
        ],
        responses: {
          [Status.OK]: {
            description: 'List of posts',
            content: { ['application/json']: { schema: { $ref: '' } } },
          },
        },
      },
    };
    const { params, paramsRefs } = mock.mergeParams(pathItem, 'GET');
    expect(params).toEqual([
      { in: 'query', name: 'catId' },
      { in: 'query', name: 'rubricId' },
      { in: 'query', name: 'contextId' },
    ]);
    expect(paramsRefs).toEqual([]);
  });
});
