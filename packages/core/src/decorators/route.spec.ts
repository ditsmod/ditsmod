import { DecoratorAndValue, reflector } from '#di';
import { RequestContext } from '#interceptors/tokens-and-types.js';
import { CanActivate } from '#types/mix.js';
import { getCallerDir } from '../utils/callsites.js';
import { controller } from './controller.js';
import { route } from './route.js';

describe('Route decorator', () => {
  it('controller without methods', () => {
    @controller()
    class Controller1 {}

    const actualMeta = reflector.getMetadata(Controller1)!;
    expect(actualMeta.constructor.type).toBe(Function);
    expect(actualMeta.constructor.decorators).toMatchObject<DecoratorAndValue[]>([
      new DecoratorAndValue(controller, {}, getCallerDir()),
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
    const decorator = new DecoratorAndValue(route, {
      httpMethod: 'GET',
      path: '',
      guards: [],
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
    const decoratorGet = new DecoratorAndValue(route, {
      httpMethod: 'GET',
      path: '',
      guards: [],
    });
    const decoratorPost = new DecoratorAndValue(route, {
      httpMethod: 'POST',
      path: '',
      guards: [],
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
    const decorator = new DecoratorAndValue(route, {
      httpMethod: 'GET',
      path: 'posts/:postId',
      guards: [Guard1],
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
    const decorator = new DecoratorAndValue(route, {
      httpMethod: 'GET',
      path: 'posts/:postId',
      guards: [Guard1, Guard1],
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
      new DecoratorAndValue(route, {
        httpMethod: 'GET',
        path: 'posts/:postId',
        guards: [
          [Guard1, 'one', 123],
          [Guard1, []],
        ],
      }),
    ]);
  });
});
