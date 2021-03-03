import 'reflect-metadata';
import { Injectable, reflector } from '@ts-stack/di';

import { Module } from '../decorators/module';
import { isController, isModule, isRootModule, isRoute } from './type-guards';
import { ModuleMetadata } from '../types/module-metadata';
import { RootModule } from '../decorators/root-module';
import { Controller } from '../decorators/controller';
import { Route, RouteDecoratorMetadata } from '../decorators/route';
import { CanActivate } from '../types/can-activate';

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

  describe('RootModule()', () => {
    it('class with decorator', () => {
      @RootModule()
      class Module1 {}
      const metadata = reflector.annotations(Module1)[0] as ModuleMetadata;
      expect(isRootModule(metadata)).toBe(true);
    });

    it('class without decorator', () => {
      class Module1 {}
      const metadata = reflector.annotations(Module1)[0] as ModuleMetadata;
      expect(isRootModule(metadata)).toBe(false);
    });
  });

  describe('Controller()', () => {
    it('class with decorator', () => {
      @Controller()
      class Module1 {}
      const metadata = reflector.annotations(Module1)[0] as ModuleMetadata;
      expect(isController(metadata)).toBe(true);
    });

    it('class without decorator', () => {
      class Module1 {}
      const metadata = reflector.annotations(Module1)[0] as ModuleMetadata;
      expect(isController(metadata)).toBe(false);
    });
  });

  describe('isRoute()', () => {
    @Injectable()
    class Guard1 implements CanActivate {
      canActivate() {
        return true;
      }

      other() {}
    }

    @Controller()
    class ClassWithDecorators {
      @Route('GET', '', [Guard1])
      some() {}
    }

    it('should recognize the route', () => {
      const propMetadata = reflector.propMetadata(ClassWithDecorators) as RouteDecoratorMetadata;
      expect(isRoute(propMetadata.some[0])).toBe(true);
    });
  });
});
