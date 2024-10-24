import { reflector, controller, CanActivate, RequestContext, DecoratorAndValue, getCallerDir } from '@ditsmod/core';
import { oasRoute } from './oas-route.js';

// console.log(inspect(actualMeta, false, 5));

describe('@oasRoute', () => {
  it('controller without methods', () => {
    @controller()
    class Controller1 {}

    const actualMeta = reflector.getMetadata(Controller1);
    expect(actualMeta.constructor.type).toBe(Function);
    expect(actualMeta.constructor.decorators).toMatchObject<DecoratorAndValue[]>([
      new DecoratorAndValue(controller, {}, getCallerDir()),
    ]);
  });

  it('one method, without operation object', () => {
    @controller()
    class Controller1 {
      @oasRoute('GET')
      method() {}
    }

    const actualMeta = reflector.getMetadata(Controller1);
    expect(actualMeta.method.type).toBe(Function);
    const value = { httpMethod: 'GET', path: undefined };
    expect(actualMeta.method.decorators).toEqual<DecoratorAndValue[]>([new DecoratorAndValue(oasRoute, value)]);
  });

  it('one method, with operation object', () => {
    class Guard implements CanActivate {
      canActivate(ctx: RequestContext) {
        return true;
      }
    }
    @controller()
    class Controller1 {
      @oasRoute('GET', 'posts', [Guard], { operationId: 'someId' })
      method() {}
    }

    const actualMeta = reflector.getMetadata(Controller1);
    expect(actualMeta.method.type).toBe(Function);
    const value = { httpMethod: 'GET', path: 'posts', guards: [Guard], operationObject: { operationId: 'someId' } };
    expect(actualMeta.method.decorators).toEqual<DecoratorAndValue[]>([new DecoratorAndValue(oasRoute, value)]);
  });

  it('route with operationObject as third argument', () => {
    @controller()
    class Controller1 {
      @oasRoute('GET', 'path', { operationId: 'someId' })
      method() {}
    }

    const actualMeta = reflector.getMetadata(Controller1);

    expect(actualMeta.method.type).toBe(Function);
    const value = { httpMethod: 'GET', path: 'path', operationObject: { operationId: 'someId' } };
    expect(actualMeta.method.decorators).toEqual<DecoratorAndValue[]>([new DecoratorAndValue(oasRoute, value)]);
  });
});
