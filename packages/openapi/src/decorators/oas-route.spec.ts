import 'reflect-metadata';
import { reflector } from '@ts-stack/di';
import { Controller, CanActivate } from '@ditsmod/core';

import { OasRoute, OasRouteDecoratorMetadata } from './oas-route';

describe('@Route', () => {
  it('controller without methods', () => {
    @Controller()
    class Controller1 {}

    expect(reflector.propMetadata(Controller1)).toEqual({});
  });

  it('one method, one operation', () => {
    @Controller()
    class Controller1 {
      @OasRoute('GET', '', [], {})
      method() {}
    }

    const actualMeta = reflector.propMetadata(Controller1);
    const expectedMeta: OasRouteDecoratorMetadata = {
      method: [{ httpMethod: 'GET', path: '', guards: [], operationObject: {} }],
    };
    expect(actualMeta).toEqual(expectedMeta);
  });

  it('one method, two operation', () => {
    @Controller()
    class Controller1 {
      @OasRoute('GET', '', [], { get: {}, post: {} })
      method() {}
    }

    const actualMeta = reflector.propMetadata(Controller1);
    const expectedMeta: OasRouteDecoratorMetadata = {
      method: [{ httpMethod: 'GET', path: '', guards: [], operationObject: { get: {}, post: {} } }],
    };
    expect(actualMeta).toEqual(expectedMeta);
  });

  it('one guard without params', () => {
    class Guard implements CanActivate {
      canActivate() {
        return true;
      }
    }
    @Controller()
    class Controller1 {
      @OasRoute('GET', 'posts', [Guard], { get: { parameters: [{ in: 'path', name: 'postId', required: true }] } })
      method() {}
    }

    const actualMeta = reflector.propMetadata(Controller1);
    const expectedMeta: OasRouteDecoratorMetadata = {
      method: [
        {
          httpMethod: 'GET',
          path: 'posts',
          guards: [Guard],
          operationObject: { get: { parameters: [{ in: 'path', name: 'postId', required: true }] } },
        },
      ],
    };
    expect(actualMeta).toEqual(expectedMeta);
  });

  it('two guards without params', () => {
    class Guard implements CanActivate {
      canActivate() {
        return true;
      }
    }
    @Controller()
    class Controller1 {
      @OasRoute('GET', 'posts', [Guard, Guard], {
        get: { parameters: [{ in: 'path', name: 'postId', required: true }] },
      })
      method() {}
    }

    const actualMeta = reflector.propMetadata(Controller1);
    const expectedMeta: OasRouteDecoratorMetadata = {
      method: [
        {
          httpMethod: 'GET',
          path: 'posts',
          guards: [Guard, Guard],
          operationObject: { get: { parameters: [{ in: 'path', name: 'postId', required: true }] } },
        },
      ],
    };
    expect(actualMeta).toEqual(expectedMeta);
  });

  it('two guard with params', () => {
    class Guard implements CanActivate {
      canActivate() {
        return true;
      }
    }
    @Controller()
    class Controller1 {
      @OasRoute(
        'GET',
        'posts',
        [
          [Guard, 'one', 123],
          [Guard, []],
        ],
        { get: { parameters: [{ in: 'path', name: 'postId', required: true }] } }
      )
      method() {}
    }

    const actualMeta = reflector.propMetadata(Controller1);
    const expectedMeta: OasRouteDecoratorMetadata = {
      method: [
        {
          httpMethod: 'GET',
          path: 'posts',
          guards: [
            [Guard, 'one', 123],
            [Guard, []],
          ],
          operationObject: { get: { parameters: [{ in: 'path', name: 'postId', required: true }] } },
        },
      ],
    };
    expect(actualMeta).toEqual(expectedMeta);
  });
});
