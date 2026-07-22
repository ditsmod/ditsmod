import { forwardRef } from '#di/forward-ref.js';
import { InjectionToken } from '#di/top/injection-token.js';
import { getProviderName } from './get-provider-name.js';

describe('getProviderName()', () => {
  it('should handle null and undefined', () => {
    expect(getProviderName(null)).toBe('null');
    expect(getProviderName(undefined)).toBe('undefined');
  });

  it('should return class name for TypeProvider and class instance', () => {
    class MyService {}
    expect(getProviderName(MyService)).toBe('MyService');
    expect(getProviderName(new MyService())).toBe('MyService');
  });

  it('should handle anonymous class', () => {
    expect(getProviderName(class {})).toContain('class');
  });

  it('should return token name for normalized ClassProvider', () => {
    class TokenClass {}
    class TargetClass {}
    expect(getProviderName({ token: TokenClass, useClass: TargetClass })).toBe('TokenClass');
  });

  it('should return token name for normalized ValueProvider with string, symbol, InjectionToken', () => {
    class MyService {}
    const myToken = new InjectionToken('MY_INJECTION_TOKEN');
    const mySymbol = Symbol('MY_SYMBOL');

    expect(getProviderName({ token: 'STRING_TOKEN', useValue: 123 })).toBe('STRING_TOKEN');
    expect(getProviderName({ token: myToken, useValue: 123 })).toBe('MY_INJECTION_TOKEN');
    expect(getProviderName({ token: mySymbol, useValue: 123 })).toBe('MY_SYMBOL');
    expect(getProviderName({ token: MyService, useValue: 123 })).toBe('MyService');
  });

  it('should handle direct InjectionToken', () => {
    const myToken = new InjectionToken('MY_TOKEN');
    expect(getProviderName(myToken)).toBe('MY_TOKEN');
  });

  it('should handle direct Symbol with and without description', () => {
    const mySymbol = Symbol('MY_SYMBOL');
    const anonSymbol = Symbol();
    expect(getProviderName(mySymbol)).toBe('MY_SYMBOL');
    expect(getProviderName(anonSymbol)).toBe('Symbol()');
    expect(getProviderName({ token: anonSymbol, useValue: 123 })).toBe('Symbol()');
  });

  it('should handle direct string, number, boolean tokens', () => {
    expect(getProviderName('MY_STRING')).toBe('MY_STRING');
    expect(getProviderName(123)).toBe('123');
    expect(getProviderName(true)).toBe('true');
  });

  it('should handle forwardRef', () => {
    class RefService {}
    const refToken = new InjectionToken('REF_TOKEN');

    expect(getProviderName(forwardRef(() => RefService))).toBe('RefService');
    expect(getProviderName(forwardRef(() => refToken))).toBe('REF_TOKEN');
    expect(getProviderName({ token: forwardRef(() => RefService), useClass: RefService })).toBe('RefService');
  });
});
