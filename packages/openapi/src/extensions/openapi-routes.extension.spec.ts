import 'reflect-metadata';
import { ParameterObject, ReferenceObject, XParameterObject } from '@ts-stack/openapi-spec';

import { OpenapiRoutesExtension } from './openapi-routes.extension';
import { HttpMethod } from '@ditsmod/core';

describe('OpenapiRoutesExtension', () => {
  class MockOpenapiRoutesExtension extends OpenapiRoutesExtension {
    transformToOasPath(moduleName: string, path: string, params: XParameterObject[]) {
      return super.transformToOasPath(moduleName, path, params);
    }

    mergeParams(
      httpMethod: HttpMethod,
      path: string,
      prefixParams: (XParameterObject<any> | ReferenceObject)[],
      params: (XParameterObject<any> | ReferenceObject)[]
    ) {
      return super.mergeParams(httpMethod, path, prefixParams, params);
    }
  }

  let mock: MockOpenapiRoutesExtension;
  beforeEach(() => {
    mock = new MockOpenapiRoutesExtension(null, null, null);
  });

  describe('mergeParams()', () => {
    it('merge prefixParams with non-path params', () => {
      const prefixParams: (XParameterObject<any> | ReferenceObject)[] = [
        { in: 'query', name: 'catId' },
        { in: 'query', name: 'rubricId' },
      ];
      const parameters: (XParameterObject<any> | ReferenceObject)[] = [
        { in: 'query', name: 'rubricId' },
        { in: 'query', name: 'contextId' },
      ];
      const { paramsNonPath, paramsInPath, paramsRefs } = mock.mergeParams('GET', '', prefixParams, parameters);
      expect(paramsNonPath).toEqual([
        { in: 'query', name: 'catId' },
        { in: 'query', name: 'rubricId' },
        { in: 'query', name: 'contextId' },
      ]);
      expect(paramsInPath).toEqual([]);
      expect(paramsRefs).toEqual([]);
    });

    it('set prefixParams with path params', () => {
      const prefixParams: (XParameterObject<any> | ReferenceObject)[] = [{ in: 'path', name: 'postId' }];
      const parameters: (XParameterObject<any> | ReferenceObject)[] = [
        { in: 'query', name: 'rubricId' },
        { in: 'query', name: 'contextId' },
      ];
      const { paramsNonPath, paramsInPath, paramsRefs } = mock.mergeParams(
        'GET',
        'posts/:postId/comments',
        prefixParams,
        parameters
      );
      expect(paramsNonPath).toEqual([
        { in: 'query', name: 'rubricId' },
        { in: 'query', name: 'contextId' },
      ]);
      expect(paramsInPath).toEqual([{ in: 'path', name: 'postId' }]);
      expect(paramsRefs).toEqual([]);
    });
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
