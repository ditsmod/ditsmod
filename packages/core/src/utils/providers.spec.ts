import { jest } from '@jest/globals';

import { Logger, LoggerConfig } from '#logger/logger.js';
import { ClassFactoryProvider, Provider } from '#di/types-and-models.js';
import { ConsoleLogger } from '#logger/console-logger.js';
import { Providers } from './providers.js';
import { LogMediator } from '#logger/log-mediator.js';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { factoryMethod, injectable } from '#di';

describe('Providers', () => {
  it('call constuctor not to throw', () => {
    expect(() => new Providers()).not.toThrow();
  });

  describe('useValue()', () => {
    it('case 1', () => {
      const value = new Providers().useValue('token', 'value');
      expect([...value]).toEqual([{ token: 'token', useValue: 'value' }]);
    });

    it('case 2', () => {
      const value = new Providers().$if(true).useValue('token', 'value');
      expect([...value]).toEqual([{ token: 'token', useValue: 'value' }]);
    });

    it('case 3', () => {
      const value = new Providers().$if(false).useValue('token', 'value');
      expect([...value]).toEqual([]);
    });

    it('case 4', () => {
      const value = new Providers().$if(false).useValue('token1', 'value1').useValue('token2', 'value2');
      expect([...value]).toEqual([{ token: 'token2', useValue: 'value2' }]);
    });

    it('case 5', () => {
      class A {
        one: string;
      }
      const value = new Providers().useValue<A>(A, { one: 'value' });
      expect([...value]).toEqual([{ token: A, useValue: { one: 'value' } }]);
    });

    it('works with nested loops', () => {
      const for1 = jest.fn();
      const for2 = jest.fn();
      const providers = new Providers()
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
      const value = new Providers().useClass(A, B);
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
      const value = new Providers().$if(true).useClass(A, B);
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
      const value = new Providers().$if(false).useClass(A, B);
      expect([...value]).toEqual([]);
    });
  });

  describe('useFactories()', () => {
    it('case 1', () => {
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
      const value = new Providers().useFactories(A, B);
      expect([...value]).toEqual<ClassFactoryProvider[]>([
        { useFactory: [A, A.prototype.method1] },
        { useFactory: [B, B.prototype.method3] },
        { useFactory: [B, B.prototype.method4] },
      ]);
    });

    it('case 2', () => {
      class A {
        constructor(one: any) {}
        @factoryMethod()
        method1() {}
        method2() {}
      }
      const value = new Providers().$if(true).useFactories(A);
      expect([...value]).toEqual<ClassFactoryProvider[]>([{ useFactory: [A, A.prototype.method1] }]);
    });

    it('case 3', () => {
      class A {
        constructor(one: any) {}
        @factoryMethod()
        method1() {}
        method2() {}
      }
      const value = new Providers().$if(false).useFactories(A);
      expect([...value]).toEqual<ClassFactoryProvider[]>([]);
    });
  });

  describe('useLogConfig()', () => {
    it('case 1', () => {
      const loggerConfig = new LoggerConfig();

      const config1 = new Providers().useLogConfig(loggerConfig);
      expect([...config1]).toEqual([{ token: LoggerConfig, useValue: loggerConfig }]);

      const config2 = new Providers().useLogConfig(loggerConfig);
      expect([...config2]).toEqual([{ token: LoggerConfig, useValue: loggerConfig }]);
    });

    it('case 2', () => {
      const loggerConfig = new LoggerConfig();

      const config1 = new Providers().$if(true).useLogConfig(loggerConfig);
      expect([...config1]).toEqual([{ token: LoggerConfig, useValue: loggerConfig }]);
    });

    it('case 3', () => {
      const loggerConfig = new LoggerConfig();

      const config1 = new Providers().$if(false).useLogConfig(loggerConfig);
      expect([...config1]).toEqual([]);
    });
  });

  describe('useSystemLogMediator()', () => {
    it('case 1', () => {
      class CustomLogMediator extends LogMediator {}

      const config1 = new Providers().useSystemLogMediator(CustomLogMediator);
      expect([...config1]).toEqual([
        { token: CustomLogMediator, useClass: CustomLogMediator },
        { token: SystemLogMediator, useToken: CustomLogMediator },
      ]);
    });

    it('case 2', () => {
      class CustomLogMediator extends LogMediator {}

      const config1 = new Providers().$if(true).useSystemLogMediator(CustomLogMediator);
      expect([...config1]).toEqual([
        { token: CustomLogMediator, useClass: CustomLogMediator },
        { token: SystemLogMediator, useToken: CustomLogMediator },
      ]);
    });

    it('case 3', () => {
      class CustomLogMediator extends LogMediator {}

      const config1 = new Providers().$if(false).useSystemLogMediator(CustomLogMediator);
      expect([...config1]).toEqual([]);
    });
  });

  describe('useLogger()', () => {
    it('case 1', () => {
      const logger = new ConsoleLogger();
      const value = new Providers().useLogger(logger);
      expect([...value]).toEqual([{ token: Logger, useValue: logger }]);
    });

    it('case 2', () => {
      const logger = new ConsoleLogger();
      const value = new Providers().$if(true).useLogger(logger);
      expect([...value]).toEqual([{ token: Logger, useValue: logger }]);
    });

    it('case 3', () => {
      const logger = new ConsoleLogger();
      const value = new Providers().$if(false).useLogger(logger);
      expect([...value]).toEqual([]);
    });

    it('works multi calling case 1', () => {
      const logger = new ConsoleLogger();
      const value = new Providers().useLogger(logger).useValue('token', 'value');
      const expectedArr: Provider[] = [
        { token: Logger, useValue: logger },
        { token: 'token', useValue: 'value' },
      ];
      expect([...value]).toEqual(expectedArr);
    });

    it('works multi calling case 2', () => {
      const logger = new ConsoleLogger();
      const value = new Providers().$if(true).useLogger(logger).useValue('token', 'value');
      const expectedArr: Provider[] = [
        { token: Logger, useValue: logger },
        { token: 'token', useValue: 'value' },
      ];
      expect([...value]).toEqual(expectedArr);
    });

    it('works multi calling case 3', () => {
      const logger = new ConsoleLogger();
      const value = new Providers().$if(false).useLogger(logger).useValue('token', 'value');
      const expectedArr: Provider[] = [{ token: 'token', useValue: 'value' }];
      expect([...value]).toEqual(expectedArr);
    });
  });

  it('works with plugins', () => {
    class Some extends Providers {
      one(name: string) {
        this.useValue(name, 'молоток');
        return this;
      }
    }

    class Other extends Providers {
      two() {
        return this;
      }
    }

    class Third extends Providers {
      three() {
        return this;
      }
    }

    jest.spyOn(Some.prototype, 'one');
    jest.spyOn(Other.prototype, 'two');
    jest.spyOn(Third.prototype, 'three');

    const providers = new Providers();

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
