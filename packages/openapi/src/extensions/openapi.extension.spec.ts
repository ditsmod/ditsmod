import 'reflect-metadata';
import { ParameterObject } from '@ts-stack/openapi-spec';

import { OpenapiRoutesExtension } from './openapi-routes.extension';

describe('OpenapiRoutesExtension', () => {
  class MockOpenapiExtension extends OpenapiRoutesExtension {
    transformPath(path: string, params: ParameterObject[]) {
      return super.transformPath(path, params);
    }
  }

  let mock: MockOpenapiExtension;
  beforeEach(() => {
    mock = new MockOpenapiExtension(null, null, null);
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
    expect(path).toBe('posts/:postId/comments/:commentId');
  });
});
