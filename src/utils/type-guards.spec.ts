import 'reflect-metadata';
import { reflector, Provider } from '@ts-stack/di';

import { RootModule, RootModuleDecorator } from '../decorators/root-module';
import { ModuleDecorator, Module } from '../decorators/module';
import { Controller, ControllerDecorator } from '../decorators/controller';
import { Route, RouteDecoratorMetadata, CanActivate } from '../decorators/route';
import { isRootModule, isModule, isController, isRoute, isProvider, isObjProvider } from './type-guards';

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

  describe('isRoute()', () => {
    @Controller()
    class ClassWithDecorators {
      @Route('GET', '', [SomeGuard])
      some() {}
    }

    it('should recognize the route', () => {
      const propMetadata = reflector.propMetadata(ClassWithDecorators) as RouteDecoratorMetadata;
      expect(isRoute(propMetadata.some[0])).toBe(true);
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

  describe('isObjProvider()', () => {
    it('should recognize all types of providers', () => {
      const providers: Provider[] = [
        { provide: '', useValue: '' },
        { provide: '', useClass: class {} },
        { provide: '', useExisting: class {} },
        { provide: '', useFactory: class {} },
      ];
      expect(isObjProvider(providers)).toBe(true);
    });

    it('should fail class types of providers', () => {
      const providers: Provider[] = [class {}];
      expect(isObjProvider(providers)).toBe(false);
    });

    it('should fail check number', () => {
      const providers: Provider[] = [5 as any];
      expect(isObjProvider(providers)).toBe(false);
    });
  });
});
