import { CanActivate, reflector } from '@ditsmod/core';
import { oasGuard } from '#decorators/oas-guard.js';
import { isOasGuard } from './type-guards.js';

describe('OAS type guards', () => {
  describe('isOasGuard()', () => {
    @oasGuard({} as any)
    class Guard1 implements CanActivate {
      canActivate() {
        return true;
      }
    }

    it('should recognize class guard', () => {
      const propMetadata = reflector.getClassMetadata(Guard1);
      expect(isOasGuard(propMetadata[0])).toBe(true);
    });
  });
});
