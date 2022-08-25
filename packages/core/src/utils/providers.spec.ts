import { describe, it, expect } from '@jest/globals';
import { ServiceProvider } from 'src/types/mix';

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
    const value = new Providers().useLogger(ConsoleLogger, logger);
    expect([...value]).toEqual([{ provide: ConsoleLogger, useValue: logger, multi: undefined }]);
  });

  it('works multi calling', () => {
    const logger = new ConsoleLogger();
    const value = new Providers().useLogger(ConsoleLogger, logger).useAnyValue('token', 'value');
    const expectedArr: ServiceProvider[] = [
      { provide: ConsoleLogger, useValue: logger, multi: undefined },
      { provide: 'token', useValue: 'value', multi: undefined }
    ];
    expect([...value]).toEqual(expectedArr);
  });
});
