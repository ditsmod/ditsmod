import 'reflect-metadata';

import { ServiceProvider } from '../types/mix';
import { getTokensCollisions } from './get-tokens-collisions';

describe('getTokensCollisions()', () => {
  it('should returns empty array because duplicates are indentical', () => {
    class Provider1 {}
    class Provider2 {}
    class Provider3 {}
    class Provider4 {}
    class Provider5 {}
    let duplTokens: any[] = [Provider1, Provider2];
    const providers: ServiceProvider[] = [Provider1, Provider2, Provider4, Provider3, Provider5, Provider2, Provider1];
    duplTokens = getTokensCollisions(duplTokens, providers);
    expect(duplTokens).toEqual([]);
  });

  it('should returns array with some providers because duplicates are non indentical', () => {
    class Provider3 {}
    class Provider4 {}
    class Provider5 {}
    class Provider6 {}
    class Provider7 {}
    let duplTokens: any[] = [Provider3, Provider7];
    const providers: ServiceProvider[] = [
      Provider4,
      Provider3,
      Provider5,
      { provide: Provider3, useClass: Provider3 },
      { provide: Provider7, useClass: Provider7 },
      { provide: Provider7, useClass: Provider6 },
    ];
    duplTokens = getTokensCollisions(duplTokens, providers);
    expect(duplTokens).toEqual([Provider3, Provider7]);
  });

  it('case 3', () => {
    class Provider3 {}
    class Provider4 {}
    class Provider5 {}
    class Provider6 {}
    class Provider7 {}
    let duplTokens: any[] = [Provider6];
    const providers: ServiceProvider[] = [
      Provider4,
      Provider3,
      Provider5,
      { provide: Provider6, useClass: Provider6 },
      { provide: Provider6, useClass: Provider6 },
      { provide: Provider7, useClass: Provider7 },
    ];
    duplTokens = getTokensCollisions(duplTokens, providers);
    expect(duplTokens).toEqual([]);
  });
});
