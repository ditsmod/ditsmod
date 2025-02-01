import { featureModule, injectable, isModuleWithParams, reflector } from '@ditsmod/core';
import { describe, expect, it } from 'vitest';

import { route } from '#decorators/route.js';
import { isAppendsWithParams, isCtrlDecor, isInterceptor, isRoute } from './type.guards.js';
import { HttpHandler, HttpInterceptor } from '#interceptors/tokens-and-types.js';
import { CanActivate } from '#interceptors/guard.js';
import { controller } from './controller.js';
import { RequestContext } from '#services/request-context.js';
import { AppendsWithParams } from '#module/module-metadata.js';

describe('type guards', () => {
  describe('isController()', () => {
    it('class with decorator', () => {
      @controller()
      class Module1 {}
      const metadata = reflector.getDecorators(Module1)![0];
      expect(isCtrlDecor(metadata)).toBe(true);
    });

    it('class without decorator', () => {
      class Module1 {}
      const metadata = reflector.getMetadata(Module1);
      expect(isCtrlDecor(metadata)).toBe(false);
    });
  });

  describe('isAppendsWithParams', () => {
    it('appends with params', () => {
      @featureModule({})
      class Module1 {}

      const modRefId1: AppendsWithParams = { module: Module1, path: '' };
      expect(isAppendsWithParams(modRefId1)).toBe(true);
      const modRefId2: AppendsWithParams = { module: Module1, absolutePath: '' };
      expect(isAppendsWithParams(modRefId2)).toBe(true);
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
