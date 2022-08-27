import { describe, it, fit, expect, jest } from '@jest/globals';
import { Logger } from '../types/logger';
import { ServiceProvider } from '../types/mix';

import { ConsoleLogger } from '../services/console-logger';
import { Providers } from './providers';

describe('Providers', () => {
  it('call constuctor not to throw', () => {
    expect(() => new Providers()).not.toThrow();
  });

  it('works useAnyValue()', () => {
    const value = new Providers().useAnyValue('token', 'value');
    expect([...value]).toEqual([{ provide: 'token', useValue: 'value', multi: undefined }]);
  });

  it('works useValue()', () => {
    class A {
      one: string;
    }
    const value = new Providers().useValue(A, { one: 'value' });
    expect([...value]).toEqual([{ provide: A, useValue: { one: 'value' }, multi: undefined }]);
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
    expect([...value]).toEqual([{ provide: A, useClass: B, multi: undefined }]);
  });

  it('works useLogger()', () => {
    const logger = new ConsoleLogger();
    const value = new Providers().useLogger(logger);
    expect([...value]).toEqual([{ provide: Logger, useValue: logger, multi: undefined }]);
  });

  it('works multi calling', () => {
    const logger = new ConsoleLogger();
    const value = new Providers().useLogger(logger).useAnyValue('token', 'value');
    const expectedArr: ServiceProvider[] = [
      { provide: Logger, useValue: logger, multi: undefined },
      { provide: 'token', useValue: 'value', multi: undefined },
    ];
    expect([...value]).toEqual(expectedArr);
  });

  it('works with plugins', () => {
    class Some extends Providers {
      one(name: string) {
        this.useAnyValue(name, 'молоток');
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
      providers
        .use(Some)
        .use(Other)
        .two()
        .two()
        .one('Mostia')
        .use(Third)
        .three()
        .useAnyValue('token', 'value');
    }

    expect(callback).not.toThrow();
    expect(Some.prototype.one).toBeCalledTimes(1);
    expect(Other.prototype.two).toBeCalledTimes(2);
    expect(Third.prototype.three).toBeCalledTimes(1);
    expect([...providers]).toEqual([
      { provide: 'Mostia', useValue: 'молоток', multi: undefined },
      { provide: 'token', useValue: 'value', multi: undefined },
    ]);
  });
});
