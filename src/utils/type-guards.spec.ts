import 'reflect-metadata';
import { reflector } from '@ts-stack/di';

import { Module } from '../decorators/module';
import { isModule } from './type-guards';
import { ModuleMetadata } from '../types/module-metadata';

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
