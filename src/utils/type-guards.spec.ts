import 'reflect-metadata';
import { reflector } from '@ts-stack/di';

import { Module, ModuleMetadata } from '../decorators/module';
import { isModule } from './type-guards';

describe('type guards', () => {
  describe('isModule()', () => {
    it('class with decorator', () => {
      @Module()
      class Module1 {}
      const metadata = reflector.annotations(Module1)[0] as ModuleMetadata;
      expect(isModule(metadata)).toBe(true);
    });

    it('class without decorator', () => {
      class Module1 {}
      const metadata = reflector.annotations(Module1)[0] as ModuleMetadata;
      expect(isModule(metadata)).toBe(false);
    });
  });
});
