import { CanActivate, controller, DecoratorAndValue, CallsiteUtils, reflector, RequestContext, InjectionToken, Extension } from '@ditsmod/core';
import { describe, expect, it } from 'vitest';

import { route, RouteMetadata } from './route.js';
import { HttpHandler, HttpInterceptor } from '#interceptors/tokens-and-types.js';

describe('Route decorator', () => {
  it('controller without methods', () => {
    @controller()
    class Controller1 {}

    const actualMeta = reflector.getMetadata(Controller1)!;
    expect(actualMeta.constructor.type).toBe(Function);
    expect(actualMeta.constructor.decorators).toMatchObject<DecoratorAndValue[]>([
      new DecoratorAndValue(controller, {}, CallsiteUtils.getCallerDir()),
    ]);
  });

  it('one method, one decorator', () => {
    @controller()
    class Controller1 {
      @route('GET')
      method() {}
    }

    const metadata = reflector.getMetadata(Controller1)!;
    expect(metadata.method.type).toBe(Function);
    const decorator = new DecoratorAndValue<RouteMetadata>(route, {
      httpMethod: 'GET',
      path: '',
      guards: [],
      interceptors: [],
    });
    expect(metadata.method.decorators).toMatchObject<DecoratorAndValue[]>([decorator]);
  });

  it('two HTTP methods, one decorator', () => {
    @controller()
    class Controller1 {
      @route(['GET', 'POST'])
      method() {}
    }

    const metadata = reflector.getMetadata(Controller1)!;
    expect(metadata.method.type).toBe(Function);
    const decorator = new DecoratorAndValue<RouteMetadata>(route, {
      httpMethod: ['GET', 'POST'],
      path: '',
      guards: [],
      interceptors: [],
    });
    expect(metadata.method.decorators).toMatchObject<DecoratorAndValue[]>([decorator]);
  });

  it('one method, two decorators', () => {
    @controller()
    class Controller1 {
      @route('GET')
      @route('POST')
      method() {}
    }

    const metadata = reflector.getMetadata(Controller1)!;
    expect(metadata.method.type).toBe(Function);
    const decoratorGet = new DecoratorAndValue<RouteMetadata>(route, {
      httpMethod: 'GET',
      path: '',
      guards: [],
      interceptors: [],
    });
    const decoratorPost = new DecoratorAndValue<RouteMetadata>(route, {
      httpMethod: 'POST',
      path: '',
      guards: [],
      interceptors: [],
    });
    expect(metadata.method.decorators).toMatchObject<DecoratorAndValue[]>([decoratorPost, decoratorGet]);
  });

  it('one guard without params', () => {
    class Guard1 implements CanActivate {
      canActivate(ctx: RequestContext) {
        return true;
      }
    }
    @controller()
    class Controller1 {
      @route('GET', 'posts/:postId', [Guard1])
      method() {}
    }

    const metadata = reflector.getMetadata(Controller1)!;
    expect(metadata.method.type).toBe(Function);
    const decorator = new DecoratorAndValue<RouteMetadata>(route, {
      httpMethod: 'GET',
      path: 'posts/:postId',
      guards: [Guard1],
      interceptors: [],
    });
    expect(metadata.method.decorators).toMatchObject<DecoratorAndValue[]>([decorator]);
  });

  it('two guards without params', () => {
    class Guard1 implements CanActivate {
      canActivate(ctx: RequestContext) {
        return true;
      }
    }
    @controller()
    class Controller1 {
      @route('GET', 'posts/:postId', [Guard1, Guard1])
      method() {}
    }

    const metadata = reflector.getMetadata(Controller1)!;
    expect(metadata.method.type).toBe(Function);
    const decorator = new DecoratorAndValue<RouteMetadata>(route, {
      httpMethod: 'GET',
      path: 'posts/:postId',
      guards: [Guard1, Guard1],
      interceptors: [],
    });
    expect(metadata.method.decorators).toMatchObject<DecoratorAndValue[]>([decorator]);
  });

  it('two guard with params', () => {
    class Guard1 implements CanActivate {
      canActivate(ctx: RequestContext) {
        return true;
      }
    }
    @controller()
    class Controller1 {
      @route('GET', 'posts/:postId', [
        [Guard1, 'one', 123],
        [Guard1, []],
      ])
      method() {}
    }

    const metadata = reflector.getMetadata(Controller1)!;
    expect(metadata.method.type).toBe(Function);
    expect(metadata.method.decorators).toMatchObject<DecoratorAndValue[]>([
      new DecoratorAndValue<RouteMetadata>(route, {
        httpMethod: 'GET',
        path: 'posts/:postId',
        guards: [
          [Guard1, 'one', 123],
          [Guard1, []],
        ],
        interceptors: [],
      }),
    ]);
  });

  it('one interceptor, one extension group', () => {
    class Interceptor1 implements HttpInterceptor {
      async intercept(next: HttpHandler, ctx: RequestContext) {}
    }

    @controller()
    class Controller1 {
      @route('GET', 'one', [], [Interceptor1])
      method() {}
    }

    const metadata = reflector.getMetadata(Controller1)!;
    expect(metadata.method.type).toBe(Function);
    expect(metadata.method.decorators).toMatchObject<DecoratorAndValue[]>([
      new DecoratorAndValue<RouteMetadata>(route, {
        httpMethod: 'GET',
        path: 'one',
        guards: [],
        interceptors: [Interceptor1],
      }),
    ]);
  });
});
