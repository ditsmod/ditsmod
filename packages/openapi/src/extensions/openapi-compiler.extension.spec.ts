import 'reflect-metadata';
import { CanActivate, edk, HttpMethod, Status } from '@ditsmod/core';
import {
  ComponentsObject,
  PathItemObject,
  SecuritySchemeObject,
  XOasObject,
  XPathItemObject,
  XResponsesObject,
} from '@ts-stack/openapi-spec';
import { ReflectiveInjector } from '@ts-stack/di';

import { OpenapiCompilerExtension } from './openapi-compiler.extension';
import { DEFAULT_OAS_OBJECT } from '../constants';
import { OasGuard } from '../decorators/oas-guard';
import { OAS_OBJECT } from '../di-tokens';

describe('OpenapiCompilerExtension', () => {
  class MockOpenapiCompilerExtension extends OpenapiCompilerExtension {
    oasObject: XOasObject;

    setSecurityInfo(httpMethod: HttpMethod, pathItem: XPathItemObject, guards: edk.NormalizedGuard[]) {
      return super.setSecurityInfo(httpMethod, pathItem, guards);
    }

    initOasObject() {
      return super.initOasObject();
    }
  }

  let mock: MockOpenapiCompilerExtension;

  beforeEach(() => {
    const injector = ReflectiveInjector.resolveAndCreate([{ provide: OAS_OBJECT, useValue: DEFAULT_OAS_OBJECT }]);
    mock = new MockOpenapiCompilerExtension(null, injector);
  });

  describe('setSecurityInfo()', () => {
    it('path without guards', () => {
      mock.initOasObject();
      const pathItem: PathItemObject = {
        get: {},
      };
      mock.setSecurityInfo('GET', pathItem, []);
      expect(mock.oasObject).toEqual(DEFAULT_OAS_OBJECT);
    });

    it('path with basic guard', () => {
      mock.initOasObject();
      const pathItem: PathItemObject = { get: {} };
      const tags: string[] = ['tag1'];
      const securitySchemeObject: SecuritySchemeObject = {
        type: 'http',
        scheme: 'basic',
      };
      const responses: XResponsesObject = {
        [Status.UNAUTHORIZED]: {
          $ref: '#/components/responses/UnauthorizedError',
        },
      };

      @OasGuard({
        tags,
        securitySchemeObject,
        responses,
      })
      class Guard1 implements CanActivate {
        canActivate() {
          return true;
        }
      }

      const guards: edk.NormalizedGuard[] = [{ guard: Guard1 }];
      mock.setSecurityInfo('GET', pathItem, guards);
      expect(mock.oasObject).not.toEqual(DEFAULT_OAS_OBJECT);
      const expectedcomponents: ComponentsObject = { securitySchemes: { guard1: securitySchemeObject } };
      const expectPathItemObject: PathItemObject = { get: { responses, security: [{ guard1: [] }], tags } };
      expect(mock.oasObject.components).toEqual(expectedcomponents);
      expect(pathItem).toEqual(expectPathItemObject);
    });

    it('path with basic guard', () => {
      mock.initOasObject();
      const pathItem: PathItemObject = { get: {} };
      const tags: string[] = ['tag1'];
      const securitySchemeObject: SecuritySchemeObject = {
        type: 'http',
        scheme: 'basic',
      };
      const responses: XResponsesObject = {
        [Status.UNAUTHORIZED]: {
          $ref: '#/components/responses/UnauthorizedError',
        },
      };

      @OasGuard({
        tags,
        securitySchemeObject,
        responses,
      })
      class Guard1 implements CanActivate {
        canActivate() {
          return true;
        }
      }

      const guards: edk.NormalizedGuard[] = [{ guard: Guard1, params: ['scope1', 'scope2'] }];
      mock.setSecurityInfo('GET', pathItem, guards);
      expect(mock.oasObject).not.toEqual(DEFAULT_OAS_OBJECT);
      const expectedcomponents: ComponentsObject = { securitySchemes: { guard1: securitySchemeObject } };
      const expectPathItemObject: PathItemObject = {
        get: { responses, security: [{ guard1: ['scope1', 'scope2'] }], tags },
      };
      expect(mock.oasObject.components).toEqual(expectedcomponents);
      expect(pathItem).toEqual(expectPathItemObject);
    });

    it('path with two basic guards', () => {
      mock.initOasObject();
      const pathItem: PathItemObject = { get: {} };
      const tags: string[] = ['tag1'];
      const securitySchemeObject: SecuritySchemeObject = {
        type: 'http',
        scheme: 'basic',
      };
      const responses: XResponsesObject = {
        [Status.UNAUTHORIZED]: {
          $ref: '#/components/responses/UnauthorizedError',
        },
      };

      @OasGuard({
        tags,
        securitySchemeObject,
        responses,
      })
      class Guard1 implements CanActivate {
        canActivate() {
          return true;
        }
      }

      const guards: edk.NormalizedGuard[] = [{ guard: Guard1 }, { guard: Guard1 }];
      mock.setSecurityInfo('GET', pathItem, guards);
      expect(mock.oasObject).not.toEqual(DEFAULT_OAS_OBJECT);
      const expectedcomponents: ComponentsObject = { securitySchemes: { guard1: securitySchemeObject } };
      const expectPathItemObject: PathItemObject = { get: { responses, security: [{ guard1: [] }], tags } };
      expect(mock.oasObject.components).toEqual(expectedcomponents);
      expect(pathItem).toEqual(expectPathItemObject);
    });

    it('guard with two @OasGuard() decorators', () => {
      mock.initOasObject();
      const pathItem: PathItemObject = { get: {} };
      const securitySchemeObject1: SecuritySchemeObject = {
        type: 'http',
        scheme: 'basic',
      };
      const securitySchemeObject2: SecuritySchemeObject = {
        type: 'apiKey',
        in: 'header',
        name: 'keyNameHere',
      };
      const responses: XResponsesObject = {
        [Status.UNAUTHORIZED]: {
          $ref: '#/components/responses/UnauthorizedError',
        },
      };

      @OasGuard({
        tags: ['tag2'],
        securitySchemeObject: securitySchemeObject2,
        responses,
      })
      @OasGuard({
        tags: ['tag1'],
        securitySchemeObject: securitySchemeObject1,
        responses,
      })
      class Guard1 implements CanActivate {
        canActivate() {
          return true;
        }
      }

      const guards: edk.NormalizedGuard[] = [{ guard: Guard1 }];
      mock.setSecurityInfo('GET', pathItem, guards);
      expect(mock.oasObject).not.toEqual(DEFAULT_OAS_OBJECT);
      const expectedComponentsObject: ComponentsObject = {
        securitySchemes: { guard1_0: securitySchemeObject1, guard1_1: securitySchemeObject2 },
      };
      const expectPathItemObject: PathItemObject = {
        get: { responses, security: [{ guard1_0: [] }, { guard1_1: [] }], tags: ['tag1', 'tag2'] },
      };
      expect(mock.oasObject.components).toEqual(expectedComponentsObject);
      expect(pathItem).toEqual(expectPathItemObject);
    });
  });
});
