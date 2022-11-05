import { describe, it, fit, expect, jest } from '@jest/globals';
import { Logger, LoggerConfig } from '../types/logger';
import { ServiceProvider } from '../types/mix';

import { ConsoleLogger } from '../services/console-logger';
import { Providers } from './providers';
import { LogFilter, LogMediator } from '../log-mediator/log-mediator';
import { SystemLogMediator } from '../log-mediator/system-log-mediator';

describe('Providers', () => {
  it('call constuctor not to throw', () => {
    expect(() => new Providers()).not.toThrow();
  });

  it('works useValue()', () => {
    const value = new Providers().useValue('token', 'value');
    expect([...value]).toEqual([{ provide: 'token', useValue: 'value' }]);
  });

  it('works useValue()', () => {
    class A {
      one: string;
    }
    const value = new Providers().useValue<A>(A, { one: 'value' });
    expect([...value]).toEqual([{ provide: A, useValue: { one: 'value' } }]);
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
    expect([...value]).toEqual([{ provide: A, useClass: B }]);
  });

  it('works useLogger()', () => {
    const logger = new ConsoleLogger();
    const value = new Providers().useLogger(logger);
    expect([...value]).toEqual([{ provide: Logger, useValue: logger }]);
  });

  it('works useLogConfig()', () => {
    const loggerConfig = new LoggerConfig();

    const config1 = new Providers().useLogConfig(loggerConfig);
    expect([...config1]).toEqual([{ provide: LoggerConfig, useValue: loggerConfig }]);

    const config2 = new Providers().useLogConfig(loggerConfig, { tags: ['one'] });
    expect([...config2]).toEqual([
      { provide: LoggerConfig, useValue: loggerConfig },
      { provide: LogFilter, useValue: { tags: ['one'] } },
    ]);
  });

  it('works useSystemLogMediator()', () => {
    class CustomLogMediator extends LogMediator {}

    const config1 = new Providers().useSystemLogMediator(CustomLogMediator);
    expect([...config1]).toEqual([CustomLogMediator, { provide: SystemLogMediator, useExisting: CustomLogMediator }]);
  });

  it('works multi calling', () => {
    const logger = new ConsoleLogger();
    const value = new Providers().useLogger(logger).useValue('token', 'value');
    const expectedArr: ServiceProvider[] = [
      { provide: Logger, useValue: logger },
      { provide: 'token', useValue: 'value' },
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
    expect(Some.prototype.one).toBeCalledTimes(1);
    expect(Other.prototype.two).toBeCalledTimes(2);
    expect(Third.prototype.three).toBeCalledTimes(1);
    expect([...providers]).toEqual([
      { provide: 'Mostia', useValue: 'молоток' },
      { provide: 'token', useValue: 'value' },
    ]);
  });
});
