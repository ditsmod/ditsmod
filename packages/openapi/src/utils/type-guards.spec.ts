import { CanActivate, reflector } from '@ditsmod/core';
import { oasGuard } from '../decorators/oas-guard';
import { isOasGuard } from './type-guards';

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
