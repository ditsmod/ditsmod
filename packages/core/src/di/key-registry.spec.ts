import { Extension } from '#types/extension-types.js';
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

describe('getParamToken()', () => {
  it('creation param token', () => {
    const SOME_TOKEN1 = new InjectionToken<Extension[]>('SOME_TOKEN1');
    const SOME_TOKEN2 = new InjectionToken<Extension[]>('SOME_TOKEN2');
    const PARAM_TOKEN1 = KeyRegistry.getParamToken(SOME_TOKEN1, 'ctx1');
    const PARAM_TOKEN2 = KeyRegistry.getParamToken(SOME_TOKEN2, 'ctx1');
    const PARAM_TOKEN3 = KeyRegistry.getParamToken(SOME_TOKEN2, 'ctx2');
    const PARAM_TOKEN1_1 = KeyRegistry.getParamToken(SOME_TOKEN1, 'ctx2');
    const PARAM_TOKEN1_2 = KeyRegistry.getParamToken(SOME_TOKEN1, 'ctx3');
    expect(PARAM_TOKEN1).toBeInstanceOf(InjectionToken);
    expect(PARAM_TOKEN3).toBeInstanceOf(InjectionToken);
    expect(PARAM_TOKEN2).toBeInstanceOf(InjectionToken);
    expect(PARAM_TOKEN1).not.toBe(PARAM_TOKEN2);
    expect(PARAM_TOKEN1).not.toBe(PARAM_TOKEN3);
    expect(PARAM_TOKEN2).not.toBe(PARAM_TOKEN3);
    expect(PARAM_TOKEN1.toString()).toBe('PARAM_TOKEN-1-1');
    expect(PARAM_TOKEN2.toString()).toBe('PARAM_TOKEN-2-1');
    expect(PARAM_TOKEN3.toString()).toBe('PARAM_TOKEN-2-2');
    expect(PARAM_TOKEN1_1.toString()).toBe('PARAM_TOKEN-1-2');
    expect(PARAM_TOKEN1_2.toString()).toBe('PARAM_TOKEN-1-3');

    const PARAM_TOKEN4 = KeyRegistry.getParamToken(SOME_TOKEN1, 'ctx1');
    expect(PARAM_TOKEN1 === PARAM_TOKEN4).toBe(true);
    const PARAM_TOKEN5 = KeyRegistry.getParamToken(SOME_TOKEN2, 'ctx1');
    expect(PARAM_TOKEN2 === PARAM_TOKEN5).toBe(true);
    const PARAM_TOKEN6 = KeyRegistry.getParamToken(SOME_TOKEN2, 'ctx2');
    expect(PARAM_TOKEN3 === PARAM_TOKEN6).toBe(true);
  });
});
