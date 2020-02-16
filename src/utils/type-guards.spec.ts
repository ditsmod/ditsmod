import 'reflect-metadata';
import { reflector, Provider } from 'ts-di';

import { RootModule, RootModuleDecorator } from '../decorators/root-module';
import { ModuleDecorator, Module } from '../decorators/module';
import { Controller, ControllerDecorator } from '../decorators/controller';
import { Route, RouteDecoratorMetadata } from '../decorators/route';
import {
  isRootModule,
  isModule,
  isController,
  isRoute,
  isProvider,
  isEntity,
  isColumn,
  isColumnType
} from './type-guards';
import { Column } from '../modules/orm/decorators/column';
import { Entity } from '../modules/orm/decorators/entity';

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

  describe('isColumnType()', () => {
    enum EnumType {
      one,
      two
    }

    class ClassWithDecorators {
      @((Route as any)())
      prop0: boolean; // Boolean
      @Column()
      prop1: string; // String
      @Column()
      prop2: string; // String
      @Column()
      prop3: string[]; // Array
      @Column()
      prop4: [string, number]; // Array
      @Column()
      prop5: []; // Array
      @Column()
      prop6: EnumType; // Number
      @Column()
      prop7: any; // Object
      @Column()
      prop8: void; // undefined
      @Column()
      prop9: never; // undefined
      @Column()
      // tslint:disable-next-line: ban-types
      prop10: Object; // Object
      @Column()
      prop11: object; // Object
      @Column()
      prop12: unknown; // Object
    }

    it('should recognize the type of Column', () => {
      const propMetadata = reflector.propMetadata(ClassWithDecorators);
      expect(isColumnType(propMetadata.prop0[0])).toBe(false);

      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].forEach(num => {
        expect(isColumnType(propMetadata[`prop${num}`][0])).toBe(true);
        expect(isColumnType(propMetadata[`prop${num}`][1])).toBe(false);
      });
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
