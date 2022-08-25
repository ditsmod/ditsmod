import 'reflect-metadata';
import { inspect } from 'util';
import { reflector } from '@ts-stack/di';
import { Controller, CanActivate } from '@ditsmod/core';
import { it, jest, describe, beforeEach, expect, xdescribe, beforeAll, afterEach } from '@jest/globals';

import { OasRoute, OasRouteDecoratorMetadata } from './oas-route';

// console.log(inspect(actualMeta, false, 5));

describe('@OasRoute', () => {
  it('controller without methods', () => {
    @Controller()
    class Controller1 {}

    expect(reflector.propMetadata(Controller1)).toEqual({});
  });

  it('one method, without operation object', () => {
    @Controller()
    class Controller1 {
      @OasRoute('GET')
      method() {}
    }

    const actualMeta = reflector.propMetadata(Controller1);
    const expectedMeta: OasRouteDecoratorMetadata = {
      method: [{ httpMethod: 'GET', path: undefined }],
    };
    expect(actualMeta).toEqual(expectedMeta);
  });

  it('one method, with operation object', () => {
    class Guard implements CanActivate {
      canActivate() {
        return true;
      }
    }
    @Controller()
    class Controller1 {
      @OasRoute('GET', 'posts', [Guard], { operationId: 'someId' })
      method() {}
    }

    const actualMeta = reflector.propMetadata(Controller1);
    const expectedMeta: OasRouteDecoratorMetadata = {
      method: [
        {
          httpMethod: 'GET',
          path: 'posts',
          guards: [Guard],
          operationObject: { operationId: 'someId' },
        },
      ],
    };
    expect(actualMeta).toEqual(expectedMeta);
  });

  it('route with operationObject as third argument', () => {
    @Controller()
    class Controller1 {
      @OasRoute('GET', 'path', { operationId: 'someId' })
      method() {}
    }

    const actualMeta = reflector.propMetadata(Controller1);
    const expectedMeta: OasRouteDecoratorMetadata = {
      method: [
        {
          httpMethod: 'GET',
          path: 'path',
          operationObject: { operationId: 'someId' },
        },
      ],
    };

    expect(actualMeta).toEqual(expectedMeta);
  });
});
