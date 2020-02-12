import 'reflect-metadata';
import { reflector, Provider } from 'ts-di';

import { RootModule, RootModuleDecorator } from '../decorators/root-module';
import { ModuleDecorator, Module } from '../decorators/module';
import { Controller, ControllerDecorator } from '../decorators/controller';
import { Route, RouteDecoratorMetadata } from '../decorators/route';
import { isRootModule, isModule, isController, isRoute, isProvider, isEntity, isColumn } from './type-guards';
import { Entity } from '../decorators/entity';
import { Column } from '../decorators/column';

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

  describe('isEntity()', () => {
    @Entity()
    class ClassWithDecorators {}

    it('should recognize the entity', () => {
      const metadata = reflector.annotations(ClassWithDecorators)[0];
      expect(isEntity(metadata)).toBe(true);
    });
  });

  describe('isColumn()', () => {
    class ClassWithDecorators {
      @Column()
      prop1: number;
    }

    it('should recognize the Column of Entity and type of Column', () => {
      const propMetadata = reflector.propMetadata(ClassWithDecorators);
      expect(propMetadata.prop1[0] === Number).toBe(true);
      expect(isColumn(propMetadata.prop1[1])).toBe(true);
    });
  });

  describe('isRoute()', () => {
    @Controller()
    class ClassWithDecorators {
      @Route('GET')
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
        { provide: '', useFactory: class {} }
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
