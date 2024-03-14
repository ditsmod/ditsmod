import { jest } from '@jest/globals';

import { Logger, LoggerConfig } from '#logger/logger.js';
import { Provider } from '#types/mix.js';
import { ConsoleLogger } from '#logger/console-logger.js';
import { Providers } from './providers.js';
import { LogMediator } from '#logger/log-mediator.js';
import { SystemLogMediator } from '#logger/system-log-mediator.js';

describe('Providers', () => {
  it('call constuctor not to throw', () => {
    expect(() => new Providers()).not.toThrow();
  });

  it('works useValue()', () => {
    const value = new Providers().useValue('token', 'value');
    expect([...value]).toEqual([{ token: 'token', useValue: 'value' }]);
  });

  it('works useValue()', () => {
    class A {
      one: string;
    }
    const value = new Providers().useValue<A>(A, { one: 'value' });
    expect([...value]).toEqual([{ token: A, useValue: { one: 'value' } }]);
  });

  it('works useClass()', () => {
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

  it('works useLogger()', () => {
    const logger = new ConsoleLogger();
    const value = new Providers().useLogger(logger);
    expect([...value]).toEqual([{ token: Logger, useValue: logger }]);
  });

  it('works useLogConfig()', () => {
    const loggerConfig = new LoggerConfig();

    const config1 = new Providers().useLogConfig(loggerConfig);
    expect([...config1]).toEqual([{ token: LoggerConfig, useValue: loggerConfig }]);

    const config2 = new Providers().useLogConfig(loggerConfig);
    expect([...config2]).toEqual([
      { token: LoggerConfig, useValue: loggerConfig },
    ]);
  });

  it('works useSystemLogMediator()', () => {
    class CustomLogMediator extends LogMediator {}

    const config1 = new Providers().useSystemLogMediator(CustomLogMediator);
    expect([...config1]).toEqual([
      { token: CustomLogMediator, useClass: CustomLogMediator },
      { token: SystemLogMediator, useToken: CustomLogMediator },
    ]);
  });

  it('works multi calling', () => {
    const logger = new ConsoleLogger();
    const value = new Providers().useLogger(logger).useValue('token', 'value');
    const expectedArr: Provider[] = [
      { token: Logger, useValue: logger },
      { token: 'token', useValue: 'value' },
    ];
    expect([...value]).toEqual(expectedArr);
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
      providers.use(Some).use(Other).two().two().one('Mostia').use(Third).three().useValue('token', 'value');
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
