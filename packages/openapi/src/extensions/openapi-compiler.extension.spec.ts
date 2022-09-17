import 'reflect-metadata';
import { CanActivate, NormalizedGuard, Status } from '@ditsmod/core';
import {
  ComponentsObject,
  OperationObject,
  SecuritySchemeObject,
  XOasObject,
  XOperationObject,
  XResponsesObject,
} from '@ts-stack/openapi-spec';
import { ReflectiveInjector } from '@ts-stack/di';
import { it, jest, describe, beforeEach, expect, xdescribe, beforeAll, afterEach } from '@jest/globals';

import { OpenapiCompilerExtension } from './openapi-compiler.extension';
import { DEFAULT_OAS_OBJECT } from '../constants';
import { OasGuard } from '../decorators/oas-guard';

describe('OpenapiCompilerExtension', () => {
  class MockOpenapiCompilerExtension extends OpenapiCompilerExtension {
    override oasObject: XOasObject;

    override setSecurityInfo(operationObject: XOperationObject, guards: NormalizedGuard[]) {
      return super.setSecurityInfo(operationObject, guards);
    }

    override initOasObject() {
      return super.initOasObject();
    }
  }

  let mock: MockOpenapiCompilerExtension;
  const log = { oasObjectNotFound() {} };

  beforeEach(() => {
    const injector = ReflectiveInjector.resolveAndCreate([]);
    mock = new MockOpenapiCompilerExtension(injector, injector, null as any, log as any, {});
  });

  describe('setSecurityInfo()', () => {
    it('path without guards', () => {
      mock.initOasObject();
      const operationObject: OperationObject = {};
      mock.setSecurityInfo(operationObject, []);
      expect(mock.oasObject).toEqual(DEFAULT_OAS_OBJECT);
    });

    it('path with basic guard', () => {
      mock.initOasObject();
      const operationObject: OperationObject = {};
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

      const guards: NormalizedGuard[] = [{ guard: Guard1 }];
      mock.setSecurityInfo(operationObject, guards);
      expect(mock.oasObject).not.toEqual(DEFAULT_OAS_OBJECT);
      const expectedComponents: ComponentsObject = { securitySchemes: { guard1: securitySchemeObject } };
      const expectOperationObject: OperationObject = { responses, security: [{ guard1: [] }], tags };
      expect(mock.oasObject.components).toEqual(expectedComponents);
      expect(operationObject).toEqual(expectOperationObject);
    });

    it('path with basic guard and two scopes', () => {
      mock.initOasObject();
      const operationObject: OperationObject = {};
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

      const guards: NormalizedGuard[] = [{ guard: Guard1, params: ['scope1', 'scope2'] }];
      mock.setSecurityInfo(operationObject, guards);
      expect(mock.oasObject).not.toEqual(DEFAULT_OAS_OBJECT);
      const expectedcomponents: ComponentsObject = { securitySchemes: { guard1: securitySchemeObject } };
      const expectOperationObject: OperationObject = { responses, security: [{ guard1: ['scope1', 'scope2'] }], tags };
      expect(mock.oasObject.components).toEqual(expectedcomponents);
      expect(operationObject).toEqual(expectOperationObject);
    });

    it('path with two basic guards', () => {
      mock.initOasObject();
      const operationObject: OperationObject = {};
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

      const guards: NormalizedGuard[] = [{ guard: Guard1 }, { guard: Guard1 }];
      mock.setSecurityInfo(operationObject, guards);
      expect(mock.oasObject).not.toEqual(DEFAULT_OAS_OBJECT);
      const expectedcomponents: ComponentsObject = { securitySchemes: { guard1: securitySchemeObject } };
      const expectOperationObject: OperationObject = { responses, security: [{ guard1: [] }], tags };
      expect(mock.oasObject.components).toEqual(expectedcomponents);
      expect(operationObject).toEqual(expectOperationObject);
    });

    it('guard with two @OasGuard() decorators', () => {
      mock.initOasObject();
      const operationObject: OperationObject = {};
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

      const guards: NormalizedGuard[] = [{ guard: Guard1 }];
      mock.setSecurityInfo(operationObject, guards);
      expect(mock.oasObject).not.toEqual(DEFAULT_OAS_OBJECT);
      const expectedComponentsObject: ComponentsObject = {
        securitySchemes: { guard1_0: securitySchemeObject1, guard1_1: securitySchemeObject2 },
      };
      const expectOperationObject: OperationObject = {
        responses,
        security: [{ guard1_0: [] }, { guard1_1: [] }],
        tags: ['tag1', 'tag2'],
      };
      expect(mock.oasObject.components).toEqual(expectedComponentsObject);
      expect(operationObject).toEqual(expectOperationObject);
    });
  });
});
