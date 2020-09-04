import 'reflect-metadata';
import { reflector, Provider } from '@ts-stack/di';

import { RootModule, RootModuleDecorator } from '../decorators/root-module';
import { ModuleDecorator, Module } from '../decorators/module';
import { Controller, ControllerDecorator } from '../decorators/controller';
import { Route, RouteDecoratorMetadata } from '../decorators/route';
import { CanActivate, Guard, GuardDecoratorMetadata } from '../decorators/guard';
import { isRootModule, isModule, isController, isRoute, isProvider, isGuard } from './type-guards';

describe('type-guards', () => {
  describe('isRootModule()', () => {
    @RootModule()
    class ClassWithDecorators {}

    it('should recognize the root module', () => {
      const metadata = reflector.annotations(ClassWithDecorators)[0] as RootModuleDecorator;
      expect(isRootModule(metadata)).toBe(true);
    });
  });

  describe('isModule()', () => {
    @Module()
    class ClassWithDecorators {}

    it('should recognize the module', () => {
      const metadata = reflector.annotations(ClassWithDecorators)[0] as ModuleDecorator;
      expect(isModule(metadata)).toBe(true);
    });
  });

  describe('isController()', () => {
    @Controller()
    class ClassWithDecorators {}

    it('should recognize the controller', () => {
      const metadata = reflector.annotations(ClassWithDecorators)[0] as ControllerDecorator;
      expect(isController(metadata)).toBe(true);
    });
  });

  class SomeGuard implements CanActivate {
    canActivate() {
      return true;
    }

    other() {}
  }

  describe('isRoute() and isGuard', () => {
    const params = ['one', 2];
    @Controller()
    class ClassWithDecorators {
      @Guard(SomeGuard, params)
      @Route('GET', '')
      someMethod() {}
    }

    it('should recognize the route', () => {
      const propMetadata = reflector.propMetadata(ClassWithDecorators) as RouteDecoratorMetadata &
        GuardDecoratorMetadata;
      expect(isGuard(propMetadata.someMethod[0])).toBe(true);
      expect(isRoute(propMetadata.someMethod[1])).toBe(true);
      expect(propMetadata.someMethod[0].guard === SomeGuard).toBe(true);
      expect(propMetadata.someMethod[0].params).toEqual(params);
    });
  });

  describe('isProvider()', () => {
    it('should recognize all types of providers', () => {
      const providers: Provider[] = [
        class {},
        { provide: '', useValue: '' },
        { provide: '', useClass: class {} },
        { provide: '', useExisting: class {} },
        { provide: '', useFactory: class {} },
      ];
      expect(isProvider(providers)).toBe(true);
    });

    it('should to trow error, if we check object {}', () => {
      const providers: Provider = {} as any;
      expect(() => isProvider(providers)).toThrow(
        'Invalid provider - only instances of Provider and Type are allowed, got: {}'
      );
    });

    it('should to trow error, if we check number', () => {
      const providers: Provider = 5 as any;
      expect(() => isProvider(providers)).toThrow(
        'Invalid provider - only instances of Provider and Type are allowed, got: 5'
      );
    });
  });
});
