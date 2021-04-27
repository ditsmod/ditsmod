import 'reflect-metadata';
import { ParameterObject, ReferenceObject, XParameterObject } from '@ts-stack/openapi-spec';

import { OpenapiRoutesExtension } from './openapi-routes.extension';

describe('OpenapiRoutesExtension', () => {
  class MockOpenapiRoutesExtension extends OpenapiRoutesExtension {
    transformToOasPath(moduleName: string, path: string, params: (XParameterObject | ReferenceObject)[]) {
      return super.transformToOasPath(moduleName, path, params);
    }
  }

  let mock: MockOpenapiRoutesExtension;
  beforeEach(() => {
    mock = new MockOpenapiRoutesExtension(null, null, null);
  });

  it('transformPath()', () => {
    const params: ParameterObject[] = [
      { in: 'path', name: 'postId' },
      { in: 'query', name: 'rubricId' },
      { in: 'query', name: 'rubricId' },
      { in: 'path', name: 'commentId' },
      { in: 'query', name: 'contextId' },
    ];
    const path = mock.transformToOasPath('FakeModuleName', 'posts/:postId/comments/:commentId', params);
    expect(path).toBe('posts/{postId}/comments/{commentId}');
  });
});
