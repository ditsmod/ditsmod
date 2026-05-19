import { InjectionToken } from './top/injection-token.js';
import { KeyRegistry } from './key-registry.js';

describe('KeyRegistry', () => {
  it('case 1', () => {
    expect(KeyRegistry.numberOfKeys).toBe(0);
    class Token1 {}
    expect(KeyRegistry.get(Token1)).toEqual({ id: 0, token: Token1 });
    expect(KeyRegistry.numberOfKeys).toBe(1);
    expect(KeyRegistry.get(Token1)).toEqual({ id: 0, token: Token1 });
    expect(KeyRegistry.numberOfKeys).toBe(1);
    class Token2 {}
    expect(KeyRegistry.get(Token2)).toEqual({ id: 1, token: Token2 });
    expect(KeyRegistry.numberOfKeys).toBe(2);
    expect(KeyRegistry.get(Token2)).toEqual({ id: 1, token: Token2 });
    expect(KeyRegistry.numberOfKeys).toBe(2);
  });
});

describe('getGroupToken()', () => {
  it('creation group token with SomeExtension1 as groupDebugKey', () => {
    class SomeExtension1 {};
    class SomeExtension2 {};
    const someGroup1 = KeyRegistry.getGroupToken(SomeExtension1);
    const someGroup2 = KeyRegistry.getGroupToken(SomeExtension2);
    expect(someGroup1).toBeInstanceOf(InjectionToken);
    expect(someGroup2).toBeInstanceOf(InjectionToken);
    expect(someGroup1).not.toBe(SomeExtension1);
    expect(someGroup2).not.toBe(SomeExtension2);
    expect(someGroup1).not.toBe(someGroup2);
    expect(someGroup1.toString()).toBe('group of SomeExtension1');

    const someGroup3 = KeyRegistry.getGroupToken(SomeExtension1);
    expect(someGroup1).toBe(someGroup3);
  });

  it('duplicate SomeExtension1 as groupDebugKey', () => {
    class SomeExtension1 {};
    const someGroup = KeyRegistry.getGroupToken(SomeExtension1);
    expect(someGroup).toBeInstanceOf(InjectionToken);
    expect(someGroup).not.toBe(SomeExtension1);
    expect(someGroup.toString()).toBe('group of SomeExtension1-2');
  });
});
