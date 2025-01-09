import { reflector, controller, CanActivate, RequestContext, DecoratorAndValue } from '@ditsmod/core';
import { describe, expect, it } from 'vitest';

import { oasRoute, OasRouteMetadata } from './oas-route.js';
import { HttpHandler, HttpInterceptor } from '@ditsmod/routing';

// console.log(inspect(actualMeta, false, 5));

describe('@oasRoute', () => {
  it('route params: method, path, guards, interceptors, operation object', () => {
    class Guard1 implements CanActivate {
      canActivate(ctx: RequestContext) {
        return true;
      }
    }

    class Interceptor1 implements HttpInterceptor {
      async intercept(next: HttpHandler, ctx: RequestContext) {}
    }

    @controller()
    class Controller1 {
      @oasRoute('GET', 'posts', [Guard1], [Interceptor1], { operationId: 'someId' })
      method() {}
    }

    const actualMeta = reflector.getMetadata(Controller1)!;
    expect(actualMeta.method.type).toBe(Function);
    const value: OasRouteMetadata = {
      httpMethod: 'GET',
      path: 'posts',
      guards: [Guard1],
      interceptors: [Interceptor1],
      operationObject: { operationId: 'someId' },
    };
    expect(actualMeta.method.decorators).toEqual<DecoratorAndValue[]>([new DecoratorAndValue(oasRoute, value)]);
  });

  it('route params: method, path, guards, interceptors', () => {
    class Guard1 implements CanActivate {
      canActivate(ctx: RequestContext) {
        return true;
      }
    }

    class Interceptor1 implements HttpInterceptor {
      async intercept(next: HttpHandler, ctx: RequestContext) {}
    }

    @controller()
    class Controller1 {
      @oasRoute('GET', 'posts', [Guard1], [Interceptor1])
      method() {}
    }

    const actualMeta = reflector.getMetadata(Controller1)!;
    expect(actualMeta.method.type).toBe(Function);
    const value: OasRouteMetadata = {
      httpMethod: 'GET',
      path: 'posts',
      guards: [Guard1],
      interceptors: [Interceptor1],
      operationObject: {},
    };
    expect(actualMeta.method.decorators).toEqual<DecoratorAndValue[]>([new DecoratorAndValue(oasRoute, value)]);
  });

  it('route params: method, path, guards, operation object', () => {
    class Guard1 implements CanActivate {
      canActivate(ctx: RequestContext) {
        return true;
      }
    }
    @controller()
    class Controller1 {
      @oasRoute('GET', 'posts', [Guard1], { operationId: 'someId' })
      method() {}
    }

    const actualMeta = reflector.getMetadata(Controller1)!;
    expect(actualMeta.method.type).toBe(Function);
    const value: OasRouteMetadata = {
      httpMethod: 'GET',
      path: 'posts',
      guards: [Guard1],
      operationObject: { operationId: 'someId' },
      interceptors: [],
    };
    expect(actualMeta.method.decorators).toEqual<DecoratorAndValue[]>([new DecoratorAndValue(oasRoute, value)]);
  });

  it('route params: method, path, guards', () => {
    class Guard1 implements CanActivate {
      canActivate(ctx: RequestContext) {
        return true;
      }
    }
    @controller()
    class Controller1 {
      @oasRoute('GET', 'path', [Guard1])
      method() {}
    }

    const actualMeta = reflector.getMetadata(Controller1)!;

    expect(actualMeta.method.type).toBe(Function);
    const value: OasRouteMetadata = {
      httpMethod: 'GET',
      path: 'path',
      operationObject: {},
      guards: [Guard1],
      interceptors: [],
    };
    expect(actualMeta.method.decorators).toEqual<DecoratorAndValue[]>([new DecoratorAndValue(oasRoute, value)]);
  });

  it('route params: method, path, operation object', () => {
    @controller()
    class Controller1 {
      @oasRoute('GET', 'path', { operationId: 'someId' })
      method() {}
    }

    const actualMeta = reflector.getMetadata(Controller1)!;

    expect(actualMeta.method.type).toBe(Function);
    const value: OasRouteMetadata = {
      httpMethod: 'GET',
      path: 'path',
      operationObject: { operationId: 'someId' },
      guards: [],
      interceptors: [],
    };
    expect(actualMeta.method.decorators).toEqual<DecoratorAndValue[]>([new DecoratorAndValue(oasRoute, value)]);
  });

  it('route params: method, path', () => {
    @controller()
    class Controller1 {
      @oasRoute('GET', 'path')
      method() {}
    }

    const actualMeta = reflector.getMetadata(Controller1)!;

    expect(actualMeta.method.type).toBe(Function);
    const value: OasRouteMetadata = {
      httpMethod: 'GET',
      path: 'path',
      operationObject: {},
      guards: [],
      interceptors: [],
    };
    expect(actualMeta.method.decorators).toEqual<DecoratorAndValue[]>([new DecoratorAndValue(oasRoute, value)]);
  });

  it('route params: method', () => {
    @controller()
    class Controller1 {
      @oasRoute('GET')
      method() {}
    }

    const actualMeta = reflector.getMetadata(Controller1)!;
    expect(actualMeta.method.type).toBe(Function);
    const value: OasRouteMetadata = { httpMethod: 'GET', path: '', guards: [], interceptors: [], operationObject: {} };
    expect(actualMeta.method.decorators).toEqual<DecoratorAndValue[]>([new DecoratorAndValue(oasRoute, value)]);
  });
});
