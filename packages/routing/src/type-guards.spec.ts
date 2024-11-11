import { CanActivate, controller, injectable, reflector, RequestContext } from '@ditsmod/core';
import { route } from './decorators/route.js';
import { isRoute } from './type.guards.js';

describe('type guards', () => {
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
});
