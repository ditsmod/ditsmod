import { describe, expect, it } from 'vitest';

import { Extension } from '#extension/extension-types.js';
import { InjectionToken } from './injection-token.js';
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

describe('getBeforeToken()', () => {
  it('creation group token with "SOME_EXTENSIONS" as groupDebugKey', () => {
    const SOME_EXTENSIONS1 = new InjectionToken<Extension[]>('SOME_EXTENSIONS');
    const SOME_EXTENSIONS2 = new InjectionToken<Extension[]>('SOME_EXTENSIONS2');
    const BERORE_SOME_EXTENSIONS1 = KeyRegistry.getBeforeToken(SOME_EXTENSIONS1);
    const BERORE_SOME_EXTENSIONS2 = KeyRegistry.getBeforeToken(SOME_EXTENSIONS2);
    expect(BERORE_SOME_EXTENSIONS1).toBeInstanceOf(InjectionToken);
    expect(BERORE_SOME_EXTENSIONS2).toBeInstanceOf(InjectionToken);
    expect(BERORE_SOME_EXTENSIONS1).not.toBe(SOME_EXTENSIONS1);
    expect(BERORE_SOME_EXTENSIONS2).not.toBe(SOME_EXTENSIONS2);
    expect(BERORE_SOME_EXTENSIONS1).not.toBe(BERORE_SOME_EXTENSIONS2);
    expect(BERORE_SOME_EXTENSIONS1.toString()).toBe('BEFORE SOME_EXTENSIONS');

    const BERORE_SOME_EXTENSIONS3 = KeyRegistry.getBeforeToken(SOME_EXTENSIONS1);
    expect(BERORE_SOME_EXTENSIONS1).toBe(BERORE_SOME_EXTENSIONS3);
  });

  it('duplicate "SOME_EXTENSIONS" as groupDebugKey', () => {
    const SOME_EXTENSIONS = new InjectionToken<Extension[]>('SOME_EXTENSIONS');
    const BERORE_SOME_EXTENSIONS = KeyRegistry.getBeforeToken(SOME_EXTENSIONS);
    expect(BERORE_SOME_EXTENSIONS).toBeInstanceOf(InjectionToken);
    expect(BERORE_SOME_EXTENSIONS).not.toBe(SOME_EXTENSIONS);
    expect(BERORE_SOME_EXTENSIONS.toString()).toBe('BEFORE SOME_EXTENSIONS-2');
  });
});
