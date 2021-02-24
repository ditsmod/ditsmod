import 'reflect-metadata';
import { reflector, Provider } from '@ts-stack/di';

import { RootModule, RootModuleDecorator } from '../decorators/root-module';
import { ModuleDecorator, Module } from '../decorators/module';
import { Controller, ControllerDecorator } from '../decorators/controller';
import { Route, RouteDecoratorMetadata, CanActivate } from '../decorators/route';
import {
  isRootModule,
  isModule,
  isController,
  isRoute,
  isProvider,
  isNormalizedProvider,
  isExtensionProvider,
} from './type-guards';
import { Extension } from '../types/types';
import { NormalizedProvider } from './ng-utils';

describe('type-guards', () => {
  describe('isExtensionProvider()', () => {
    class Extension1 {}
    class Extension2 implements Extension {
      handleExtension() {}
    }

    const normProvider1: NormalizedProvider = {provide: Extension1, useClass: Extension1};
    const normProvider2: NormalizedProvider = {provide: Extension2, useClass: Extension2};

    it('should recognize the extension provider', () => {
      expect(isExtensionProvider(Extension1)).toBe(false);
      expect(isExtensionProvider(Extension2)).toBe(true);
      expect(isExtensionProvider(normProvider1)).toBe(false);
      expect(isExtensionProvider(normProvider2)).toBe(true);
    });
  });

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
    it('should filtered all types of providers', () => {
      @Module()
      class Module1 {}
      @RootModule()
      class Module2 {}

      expect(isProvider(class {})).toBe(true);
      expect(isProvider({ provide: '', useValue: '' })).toBe(true);
      expect(isProvider(Module1)).toBe(false);
      expect(isProvider(Module2)).toBe(false);
      expect(isProvider(5 as any)).toBe(false);
    });
  });

  describe('isNormalizedProvider()', () => {
    it('should recognize all types of providers', () => {
      const providers: Provider[] = [
        { provide: '', useValue: '' },
        { provide: '', useClass: class {} },
        { provide: '', useExisting: class {} },
        { provide: '', useFactory: class {} },
      ];
      expect(isNormalizedProvider(providers)).toBe(true);
    });

    it('should fail class types of providers', () => {
      const providers: Provider[] = [class {}];
      expect(isNormalizedProvider(providers)).toBe(false);
    });

    it('should fail check number', () => {
      const providers: Provider[] = [5 as any];
      expect(isNormalizedProvider(providers)).toBe(false);
    });
  });
});
