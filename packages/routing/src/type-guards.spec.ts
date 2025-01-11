import { controller, featureModule, injectable, isModuleWithParams, reflector, RequestContext } from '@ditsmod/core';
import { describe, expect, it } from 'vitest';

import { route } from './decorators/route.js';
import { isInterceptor, isRoute } from './type.guards.js';
import { HttpHandler, HttpInterceptor } from '#interceptors/tokens-and-types.js';
import { CanActivate } from './interceptors/guard.js';
import { AppendsWithParams } from './types.js';

describe('type guards', () => {
  describe('isAppendsWithParams', () => {
    it('appends with params', () => {
      @featureModule({})
      class Module1 {}

      const modRefId1: AppendsWithParams = { module: Module1, path: '' };
      expect(isModuleWithParams(modRefId1)).toBe(true);
      const modRefId2: AppendsWithParams = { module: Module1, absolutePath: '' };
      expect(isModuleWithParams(modRefId2)).toBe(true);
    });
  });

  describe('isRoute()', () => {
    @injectable()
    class Guard1 implements CanActivate {
      canActivate(ctx: RequestContext) {
        return true;
      }

      other() {}
    }

    @controller()
    class ClassWithDecorators {
      @route('GET', '', [Guard1])
      some() {}
    }

    it('should recognize the route', () => {
      const firstDecor = reflector.getMetadata(ClassWithDecorators)!.some.decorators[0];
      expect(isRoute({ decorator: firstDecor.decorator, value: firstDecor.value })).toBe(true);
    });
  });

  describe('isInterceptor()', () => {
    it('true Interceptor', () => {
      class Interceptor1 implements HttpInterceptor {
        async intercept(next: HttpHandler, ctx: RequestContext) {}
      }

      expect(isInterceptor(Interceptor1)).toBe(true);
    });

    it('false Interceptor', () => {
      class Interceptor1 {
        async inter(next: HttpHandler, ctx: RequestContext) {}
      }

      expect(isInterceptor(Interceptor1)).toBe(false);
    });
  });
});
