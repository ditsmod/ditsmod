import 'reflect-metadata';
import { HttpMethod, Status } from '@ditsmod/core';
import { ParameterObject, XPathItemObject } from '@ts-stack/openapi-spec';

import { OpenapiRoutesExtension } from './openapi.extension';

describe('OpenapiExtension', () => {
  class MockOpenapiExtension extends OpenapiRoutesExtension {
    mergeParams(pathItem: XPathItemObject, httpMethod: HttpMethod) {
      return super.mergeParams(pathItem, httpMethod);
    }

    transformPath(path: string, params: ParameterObject[]) {
      return super.transformPath(path, params);
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

  it('transformPath()', () => {
    const params: ParameterObject[] = [
      { in: 'path', name: 'postId' },
      { in: 'query', name: 'rubricId' },
      { in: 'query', name: 'rubricId' },
      { in: 'path', name: 'commentId' },
      { in: 'query', name: 'contextId' },
    ];
    const path = mock.transformPath('posts/{postId}/comments/{commentId}', params);
    expect(path).toEqual('posts/:postId/comments/:commentId');
  });
});
