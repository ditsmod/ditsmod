import { KeyRegistry } from './key-registry';

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
