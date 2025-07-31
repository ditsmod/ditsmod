import { FactoryProvider, TokenProvider, ValueProvider, inject, injectable, factoryMethod, optional } from '#di';
import { getDependencies } from './get-dependencies.js';

describe('getDependencies()', () => {
  class Dep1 {}

  @injectable()
  class Dep2 {
    constructor(dep1: Dep1) {}
  }

  it('should return dependencies for the ClassProvider', () => {
    @injectable()
    class Dep3 {
      constructor(dep2: Dep2, @inject('some-token1') someDep1: any, @optional() @inject('some-token2') someDep2: any) {}
    }

    expect(() => getDependencies(Dep3)).not.toThrow();
    const deps = getDependencies(Dep3);
    expect(deps.length).toBe(3);
    expect(deps[0].required).toBe(true);
    expect(deps[0].token).toBe(Dep2);
    expect(deps[1].required).toBe(true);
    expect(deps[1].token).toBe('some-token1');
    expect(deps[2].required).toBe(false);
    expect(deps[2].token).toBe('some-token2');
  });

  it('should return dependencies for the TokenProvider', () => {
    @injectable()
    class Dep3 {
      constructor(dep2: Dep2, @inject('some-token1') someDep1: any) {}
    }
    const provider: TokenProvider = { token: 'alias1', useToken: Dep3 };

    expect(() => getDependencies(provider)).not.toThrow();
    const deps = getDependencies(provider);
    expect(deps.length).toBe(1);
    expect(deps[0].required).toBe(true);
    expect(deps[0].token).toBe(Dep3);
  });

  it('should return dependencies for the FactoryProvider in form1', () => {
    @injectable()
    class Dep4 {
      constructor(@optional() @inject('some-token2') someDep2: any) {}

      @factoryMethod()
      method1(dep2: Dep2, @inject('some-token1') someDep1: any) {}
    }

    const provider: FactoryProvider = { token: 'token1', useFactory: [Dep4, Dep4.prototype.method1] };
    expect(() => getDependencies(provider)).not.toThrow();
    const deps = getDependencies(provider);
    expect(deps.length).toBe(3);
    expect(deps[0].required).toBe(true);
    expect(deps[0].token).toBe(Dep2);
    expect(deps[1].required).toBe(true);
    expect(deps[1].token).toBe('some-token1');
    expect(deps[2].required).toBe(false);
    expect(deps[2].token).toBe('some-token2');
  });

  it('should return dependencies for the FactoryProvider in form2', () => {
    function dep5(dep2: Dep2, someDep1: any) {}
    const provider: FactoryProvider = { token: 'token1', useFactory: dep5, deps: [Dep2, 'some-token1'] };
    expect(() => getDependencies(provider)).not.toThrow();
    const deps = getDependencies(provider);
    expect(deps.length).toBe(2);
    expect(deps[0].required).toBe(true);
    expect(deps[0].token).toBe(Dep2);
    expect(deps[1].required).toBe(true);
    expect(deps[1].token).toBe('some-token1');
  });

  it('should return dependencies for the ValueProvider', () => {
    const provider: ValueProvider = { token: 'token1', useValue: 'some-value' };
    expect(() => getDependencies(provider)).not.toThrow();
    const deps = getDependencies(provider);
    expect(deps.length).toBe(0);
  });
});
