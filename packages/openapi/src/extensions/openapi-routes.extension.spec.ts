import { ParameterObject, ReferenceObject, XParameterObject } from '@ts-stack/openapi-spec';

import { OpenapiRoutesExtension } from './openapi-routes.extension.js';
import { HttpMethod } from '@ditsmod/core';
import { BOUND_TO_HTTP_METHOD, BOUND_TO_PATH_PARAM } from '#utils/parameters.js';

describe('OpenapiRoutesExtension', () => {
  class MockOpenapiRoutesExtension extends OpenapiRoutesExtension {
    override transformToOasPath(moduleName: string, path: string, params: XParameterObject[]) {
      return super.transformToOasPath(moduleName, path, params);
    }

    override mergeParams(
      httpMethods: HttpMethod[],
      path: string,
      controllerName: string,
      prefixParams: (XParameterObject<any> | ReferenceObject)[],
      params: (XParameterObject<any> | ReferenceObject)[]
    ) {
      return super.mergeParams(httpMethods, path, controllerName, prefixParams, params);
    }

    override bindParams(httpMethod: HttpMethod, path: string, paramsNonPath: XParameterObject[], p: XParameterObject) {
      return super.bindParams(httpMethod, path, paramsNonPath, p);
    }
  }

  let mock: MockOpenapiRoutesExtension;
  beforeEach(() => {
    mock = new MockOpenapiRoutesExtension(null as any, null as any, null as any);
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
      const { paramsNonPath, paramsInPath, paramsRefs } = mock.mergeParams(['GET'], '', '', prefixParams, parameters);
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
        ['GET'],
        'posts/:postId/comments',
        '',
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

  describe('bindParams()', () => {
    it('without any bound params', () => {
      const paramsNonPath: XParameterObject[] = [];
      const parameter: XParameterObject = { in: 'query', name: 'page' };
      mock.bindParams('GET', 'posts/:postId', paramsNonPath, parameter);
      expect(paramsNonPath).toEqual([parameter]);
    });

    it('should add param that bound to last param in path, if it exists', () => {
      const paramsNonPath: XParameterObject[] = [];
      const parameter: XParameterObject = { in: 'query', name: 'page', [BOUND_TO_PATH_PARAM]: 1 };
      mock.bindParams('GET', 'posts/:postId', paramsNonPath, parameter);
      expect(paramsNonPath).toEqual([parameter]);
    });

    it('should not add param that bound to last param in path, if it exists', () => {
      const paramsNonPath: XParameterObject[] = [];
      const parameter: XParameterObject = { in: 'query', name: 'page', [BOUND_TO_PATH_PARAM]: 1 };
      mock.bindParams('GET', 'posts', paramsNonPath, parameter);
      expect(paramsNonPath).toEqual([]);
    });

    it('should not add param that bound to last param in path, if it not exists', () => {
      const paramsNonPath: XParameterObject[] = [];
      const parameter: XParameterObject = { in: 'query', name: 'page', [BOUND_TO_PATH_PARAM]: 0 };
      mock.bindParams('GET', 'posts/:postId', paramsNonPath, parameter);
      expect(paramsNonPath).toEqual([]);
    });

    it('should add param that bound to last param in path, if it not exists', () => {
      const paramsNonPath: XParameterObject[] = [];
      const parameter: XParameterObject = { in: 'query', name: 'page', [BOUND_TO_PATH_PARAM]: 0 };
      mock.bindParams('GET', 'posts', paramsNonPath, parameter);
      expect(paramsNonPath).toEqual([parameter]);
    });

    it('should add param that bound to GET method, without last param in path', () => {
      const paramsNonPath: XParameterObject[] = [];
      const parameter: XParameterObject = { in: 'query', name: 'page', [BOUND_TO_HTTP_METHOD]: 'GET' };
      mock.bindParams('GET', 'posts', paramsNonPath, parameter);
      expect(paramsNonPath).toEqual([parameter]);
    });

    it('should add param that bound to GET method, if url have last param in path', () => {
      const paramsNonPath: XParameterObject[] = [];
      const parameter: XParameterObject = { in: 'query', name: 'page', [BOUND_TO_HTTP_METHOD]: 'GET' };
      mock.bindParams('GET', 'posts/:postId', paramsNonPath, parameter);
      expect(paramsNonPath).toEqual([parameter]);
    });

    it('case 8', () => {
      const paramsNonPath: XParameterObject[] = [];
      const parameter: XParameterObject = { in: 'query', name: 'page', [BOUND_TO_HTTP_METHOD]: 'POST' };
      mock.bindParams('GET', 'posts/:postId', paramsNonPath, parameter);
      expect(paramsNonPath).toEqual([]);
    });

    it('case 9', () => {
      const paramsNonPath: XParameterObject[] = [];
      const parameter: XParameterObject = {
        in: 'query',
        name: 'page',
        [BOUND_TO_PATH_PARAM]: 0,
        [BOUND_TO_HTTP_METHOD]: 'GET',
      };
      mock.bindParams('GET', 'posts', paramsNonPath, parameter);
      expect(paramsNonPath).toEqual([parameter]);
    });

    it('case 10', () => {
      const paramsNonPath: XParameterObject[] = [];
      const parameter: XParameterObject = {
        in: 'query',
        name: 'page',
        [BOUND_TO_PATH_PARAM]: 0,
        [BOUND_TO_HTTP_METHOD]: 'GET',
      };
      mock.bindParams('GET', 'posts/:postId', paramsNonPath, parameter);
      expect(paramsNonPath).toEqual([]);
    });

    it('case 11', () => {
      const paramsNonPath: XParameterObject[] = [];
      const parameter: XParameterObject = {
        in: 'query',
        name: 'page',
        [BOUND_TO_PATH_PARAM]: 0,
        [BOUND_TO_HTTP_METHOD]: 'POST',
      };
      mock.bindParams('GET', 'posts', paramsNonPath, parameter);
      expect(paramsNonPath).toEqual([]);
    });
  });
});
