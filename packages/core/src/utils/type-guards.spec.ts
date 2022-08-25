import 'reflect-metadata';
import { forwardRef, Injectable, InjectionToken, reflector, ValueProvider } from '@ts-stack/di';
import { it, jest, describe, beforeEach, expect, xdescribe } from '@jest/globals';

import { Module } from '../decorators/module';
import {
  isController,
  isInjectionToken,
  isForwardRef,
  isModule,
  isModuleWithParams,
  isNormalizedProvider,
  isProvider,
  isRootModule,
  isRoute,
  isMultiProvider,
  MultiProvider,
} from './type-guards';
import { ModuleMetadata } from '../types/module-metadata';
import { RootModule } from '../decorators/root-module';
import { Controller } from '../decorators/controller';
import { Route, RouteDecoratorMetadata } from '../decorators/route';
import { CanActivate, ServiceProvider, Extension } from '../types/mix';

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

  describe('isRootModule()', () => {
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

  describe('isController()', () => {
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

  describe('isModuleWithParams', () => {
    it('module without params', () => {
      @Module()
      class Module1 {}

      expect(isModuleWithParams(Module1)).toBe(false);
    });

    it('module with params', () => {
      @Module()
      class Module1 {
        static withParams() {
          return {
            module: Module1,
            other: 123,
          };
        }
      }

      const mod = Module1.withParams();
      expect(isModuleWithParams(mod)).toBe(true);
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
      const providers: ServiceProvider[] = [
        { provide: '', useValue: '' },
        { provide: '', useClass: class {} },
        { provide: '', useExisting: class {} },
        { provide: '', useFactory: class {} },
      ];
      expect(providers.every(isNormalizedProvider)).toBe(true);
    });

    it('should fail class types of providers', () => {
      const providers: ServiceProvider[] = [class {}];
      expect(providers.every(isNormalizedProvider)).toBe(false);
    });

    it('should fail check number', () => {
      const providers: ServiceProvider[] = [5 as any];
      expect(providers.every(isNormalizedProvider)).toBe(false);
    });
  });
  describe('isInjectionToken()', () => {
    const token1 = new InjectionToken('token1');
    const token2 = {};
    class token3 implements Extension<any> {
      async init() {}
    }

    it('should recognize the InjectionToken', () => {
      expect(isInjectionToken(token1)).toBe(true);
      expect(isInjectionToken(token2)).toBe(false);
      expect(isInjectionToken(token3)).toBe(false);
    });
  });

  describe('isForwardRef()', () => {
    it('true', () => {
      const fn = forwardRef(() => 'one');
      expect(isForwardRef(fn)).toBe(true);
    });

    it('false', () => {
      function forwardRef(...args: any[]) {}
      const fn = forwardRef(() => 'one');
      expect(isForwardRef(fn)).toBe(false);
    });
  });

  describe('isMultiProvider()', () => {
    it('true ValueProvider', () => {
      const provider: MultiProvider = { provide: 'token', useValue: 'fake', multi: true };
      expect(isMultiProvider(provider)).toBe(true);
    });

    it('true ClassProvider', () => {
      const provider: MultiProvider = { provide: 'token', useClass: class {}, multi: true };
      expect(isMultiProvider(provider)).toBe(true);
    });

    it('true ExistingProvider', () => {
      const provider: MultiProvider = { provide: 'token', useExisting: class {}, multi: true };
      expect(isMultiProvider(provider)).toBe(true);
    });

    it('true FactoryProvider', () => {
      const provider: MultiProvider = { provide: 'token', useFactory: () => '', multi: true };
      expect(isMultiProvider(provider)).toBe(true);
    });

    it('false ValueProvider', () => {
      const provider: ServiceProvider = { provide: 'token', useValue: 'fake' };
      expect(isMultiProvider(provider)).toBe(false);
    });

    it('false ClassProvider', () => {
      const provider: ServiceProvider = { provide: 'token', useClass: class {} };
      expect(isMultiProvider(provider)).toBe(false);
    });

    it('false ExistingProvider', () => {
      const provider: ServiceProvider = { provide: 'token', useExisting: class {} };
      expect(isMultiProvider(provider)).toBe(false);
    });

    it('false FactoryProvider', () => {
      const provider: ServiceProvider = { provide: 'token', useFactory: () => '' };
      expect(isMultiProvider(provider)).toBe(false);
    });
  });
});
