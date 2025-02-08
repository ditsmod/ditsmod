
import { Provider } from '#di/types-and-models.js';
import { getCollisions } from './get-collisions.js';
import { makePropDecorator } from '#di';

describe('getTokensCollisions()', () => {
  it('duplicates are identical', () => {
    class Provider1 {}
    class Provider2 {}
    class Provider3 {}
    class Provider4 {}
    class Provider5 {}
    let duplTokens: any[] = [Provider1, Provider2];
    const providers: Provider[] = [Provider1, Provider2, Provider4, Provider3, Provider5, Provider2, Provider1];
    duplTokens = getCollisions(duplTokens, providers);
    expect(duplTokens).toEqual([]);
  });

  it('duplicates are non identical and non equal', () => {
    class Provider3 {}
    class Provider4 {}
    class Provider5 {}
    class Provider6 {}
    class Provider7 {}
    let duplTokens: any[] = [Provider3, Provider7];
    const providers: Provider[] = [
      Provider4,
      Provider3,
      Provider5,
      Provider3,
      { token: Provider3, useClass: Provider3 },
      { token: Provider7, useClass: Provider7 },
      { token: Provider7, useClass: Provider6 },
    ];
    duplTokens = getCollisions(duplTokens, providers);
    expect(duplTokens).toEqual([Provider3, Provider7]);
  });

  it('non-identical class providers, but equal', () => {
    class Provider3 {}
    class Provider4 {}
    class Provider5 {}
    class Provider6 {}
    class Provider7 {}
    let duplTokens: any[] = [Provider6];
    const providers: Provider[] = [
      Provider4,
      Provider3,
      Provider5,
      { token: Provider6, useClass: Provider7 },
      { token: Provider6, useClass: Provider7 },
      { token: Provider7, useClass: Provider7 },
    ];
    duplTokens = getCollisions(duplTokens, providers);
    expect(duplTokens).toEqual([]);
  });

  it('non-identical factory providers, but equal', () => {
    class Provider3 {}
    class Provider4 {}
    class Provider5 {}
    class Provider6 {}
    class Provider7 {}
    const decorFactory = makePropDecorator();
    class ClassWithFactory {
      @decorFactory()
      method1() {
        return new Provider7();
      }
    }
    let duplTokens: any[] = [Provider6];
    const providers: Provider[] = [
      Provider4,
      Provider3,
      Provider5,
      { token: Provider6, useFactory: [ClassWithFactory, ClassWithFactory.prototype.method1] },
      { token: Provider6, useFactory: [ClassWithFactory, ClassWithFactory.prototype.method1] },
      { token: Provider7, useClass: Provider7 },
    ];
    duplTokens = getCollisions(duplTokens, providers);
    expect(duplTokens).toEqual([]);
  });
});
