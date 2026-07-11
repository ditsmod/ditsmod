import { jest } from '@jest/globals';

import { Logger, LoggerConfig } from '#logger/logger.js';
import { ClassFactoryProvider, Provider } from '#di/top/types-and-models.js';
import { ConsoleLogger } from '#logger/console-logger.js';
import { ProviderBuilder } from './providers.js';
import { LogMediator } from '#logger/log-mediator.js';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { ClassWithoutDecorators } from '#error/core-errors.js';
import { factoryMethod, injectable } from '#di/decorators.js';

describe('ProviderBuilder', () => {
  it('call constuctor not to throw', () => {
    expect(() => new ProviderBuilder()).not.toThrow();
  });

  describe('useValue()', () => {
    it('case 1', () => {
      const value = new ProviderBuilder().useValue('token', 'value');
      expect([...value]).toEqual([{ token: 'token', useValue: 'value' }]);
    });

    it('case 2', () => {
      const value = new ProviderBuilder().$if(true).useValue('token', 'value');
      expect([...value]).toEqual([{ token: 'token', useValue: 'value' }]);
    });

    it('case 3', () => {
      const value = new ProviderBuilder().$if(false).useValue('token', 'value');
      expect([...value]).toEqual([]);
    });

    it('case 4', () => {
      const value = new ProviderBuilder().$if(false).useValue('token1', 'value1').useValue('token2', 'value2');
      expect([...value]).toEqual([{ token: 'token2', useValue: 'value2' }]);
    });

    it('case 5', () => {
      class A {
        one: string;
      }
      const value = new ProviderBuilder().useValue<A>(A, { one: 'value' });
      expect([...value]).toEqual([{ token: A, useValue: { one: 'value' } }]);
    });

    it('works with nested loops', () => {
      const for1 = jest.fn();
      const for2 = jest.fn();
      const providers = new ProviderBuilder()
        .useValue('token1', 'value1')
        .useValue('token2', 'value2')
        .useValue('token3', 'value3');

      for (const v of providers) {
        for1(v);

        for (const v of providers) {
          for2(v);
        }
      }
      expect(for1).toHaveBeenCalledTimes(3);
      expect(for1).toHaveBeenNthCalledWith(1, { token: 'token1', useValue: 'value1' });
      expect(for1).toHaveBeenNthCalledWith(2, { token: 'token2', useValue: 'value2' });
      expect(for1).toHaveBeenNthCalledWith(3, { token: 'token3', useValue: 'value3' });

      expect(for2).toHaveBeenCalledTimes(9);
      expect(for2).toHaveBeenNthCalledWith(1, { token: 'token1', useValue: 'value1' });
      expect(for2).toHaveBeenNthCalledWith(2, { token: 'token2', useValue: 'value2' });
      expect(for2).toHaveBeenNthCalledWith(3, { token: 'token3', useValue: 'value3' });
      expect(for2).toHaveBeenNthCalledWith(4, { token: 'token1', useValue: 'value1' });
      expect(for2).toHaveBeenNthCalledWith(5, { token: 'token2', useValue: 'value2' });
      expect(for2).toHaveBeenNthCalledWith(6, { token: 'token3', useValue: 'value3' });
      expect(for2).toHaveBeenNthCalledWith(7, { token: 'token1', useValue: 'value1' });
      expect(for2).toHaveBeenNthCalledWith(8, { token: 'token2', useValue: 'value2' });
      expect(for2).toHaveBeenNthCalledWith(9, { token: 'token3', useValue: 'value3' });
    });
  });

  describe('useClass()', () => {
    it('case 1', () => {
      class A {
        one: string;
      }
      class B {
        one: string;
        two: number;
      }
      const value = new ProviderBuilder().useClass(A, B);
      expect([...value]).toEqual([{ token: A, useClass: B }]);
    });

    it('case 2', () => {
      class A {
        one: string;
      }
      class B {
        one: string;
        two: number;
      }
      const value = new ProviderBuilder().$if(true).useClass(A, B);
      expect([...value]).toEqual([{ token: A, useClass: B }]);
    });

    it('case 3', () => {
      class A {
        one: string;
      }
      class B {
        one: string;
        two: number;
      }
      const value = new ProviderBuilder().$if(false).useClass(A, B);
      expect([...value]).toEqual([]);
    });
  });

  describe('useFactories()', () => {
    it('classes with decorators per method', () => {
      @injectable()
      class A {
        constructor(one: any) {}
        @factoryMethod()
        method1() {}
        method2() {}
      }
      class B {
        @factoryMethod()
        method3() {}
        @factoryMethod()
        method4() {}
      }
      const value = new ProviderBuilder().useFactories(A, B);
      expect([...value]).toEqual<ClassFactoryProvider[]>([
        { useFactory: [A, A.prototype.method1] },
        { useFactory: [B, B.prototype.method3] },
        { useFactory: [B, B.prototype.method4] },
      ]);
    });

    it('works if(true)', () => {
      class A {
        constructor(one: any) {}
        @factoryMethod()
        method1() {}
        method2() {}
      }
      const value = new ProviderBuilder().$if(true).useFactories(A);
      expect([...value]).toEqual<ClassFactoryProvider[]>([{ useFactory: [A, A.prototype.method1] }]);
    });

    it('works if(false)', () => {
      class A {
        constructor(one: any) {}
        @factoryMethod()
        method1() {}
        method2() {}
      }
      const value = new ProviderBuilder().$if(false).useFactories(A);
      expect([...value]).toEqual<ClassFactoryProvider[]>([]);
    });

    it('throw an error when a class no decorators per method', () => {
      @injectable()
      class A {
        constructor(one: any) {}
        @factoryMethod()
        method1() {}
        method2() {}
      }
      @injectable()
      class B {
        constructor(one: any) {}
        method3() {}
        method4() {}
      }
      const err = new ClassWithoutDecorators(1);
      expect(() => new ProviderBuilder().useFactories(A, B)).toThrow(err);
    });
  });

  it('works with plugins', () => {
    class Some extends ProviderBuilder {
      one(name: string) {
        this.useValue(name, 'молоток');
        return this;
      }
    }

    class Other extends ProviderBuilder {
      two() {
        return this;
      }
    }

    class Third extends ProviderBuilder {
      three() {
        return this;
      }
    }

    jest.spyOn(Some.prototype, 'one');
    jest.spyOn(Other.prototype, 'two');
    jest.spyOn(Third.prototype, 'three');

    const providers = new ProviderBuilder();

    function callback() {
      providers.$use(Some).$use(Other).two().two().one('Mostia').$use(Third).three().useValue('token', 'value');
    }

    expect(callback).not.toThrow();
    expect(Some.prototype.one).toHaveBeenCalledTimes(1);
    expect(Other.prototype.two).toHaveBeenCalledTimes(2);
    expect(Third.prototype.three).toHaveBeenCalledTimes(1);
    expect([...providers]).toEqual([
      { token: 'Mostia', useValue: 'молоток' },
      { token: 'token', useValue: 'value' },
    ]);
  });
});
