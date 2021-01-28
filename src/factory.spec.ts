import { Provider } from '@ts-stack/di';

import { Factory } from './factory';

describe('Factory', () => {
  class Provider1 {}
  class Provider2 {}
  class Provider3 {}
  class Provider4 {}
  class Provider5 {}
  class Provider6 {}
  class Provider7 {}

  class MockFactory extends Factory {
    getUniqProviders(providers: Provider[]) {
      return super.getUniqProviders(providers);
    }

    getTokensCollisions(duplTokens: any[], providers: Provider[]) {
      return super.getTokensCollisions(duplTokens, providers);
    }
  }

  let mock: MockFactory;

  beforeEach(() => {
    mock = new MockFactory();
  });

  describe('getTokensCollisions()', () => {
    it('case 1', () => {
      let duplTokens: any[] = [Provider1, Provider2];
      const providers: Provider[] = [Provider1, Provider2, Provider4, Provider3, Provider5, Provider2, Provider1];
      duplTokens = mock.getTokensCollisions(duplTokens, providers);
      expect(duplTokens).toEqual([]);
    });

    it('case 2', () => {
      let duplTokens: any[] = [Provider3, Provider7];
      const providers: Provider[] = [
        Provider4,
        Provider3,
        Provider5,
        { provide: Provider3, useClass: Provider3 },
        { provide: Provider7, useClass: Provider7 },
        { provide: Provider7, useClass: Provider6 },
      ];
      duplTokens = mock.getTokensCollisions(duplTokens, providers);
      expect(duplTokens).toEqual([Provider3, Provider7]);
    });

    it('case 3', () => {
      let duplTokens: any[] = [Provider6];
      const providers: Provider[] = [
        Provider4,
        Provider3,
        Provider5,
        { provide: Provider6, useClass: Provider6 },
        { provide: Provider6, useClass: Provider6 },
        { provide: Provider7, useClass: Provider7 },
      ];
      duplTokens = mock.getTokensCollisions(duplTokens, providers);
      expect(duplTokens).toEqual([]);
    });
  });

  describe('getUniqProviders()', () => {
    it('case 1', () => {
      expect(mock.getUniqProviders([Provider1, Provider1, Provider2])).toEqual([Provider1, Provider2]);
    });

    it('case 2', () => {
      const obj = { provide: Provider1, useValue: '' };
      expect(mock.getUniqProviders([obj, Provider1, Provider2])).toEqual([Provider1, Provider2]);
    });

    it('case 3', () => {
      const obj = { provide: Provider1, useValue: '' };
      expect(mock.getUniqProviders([Provider1, obj, Provider2])).toEqual([obj, Provider2]);
    });

    it('case 4', () => {
      const obj = { provide: Provider1, useValue: '' };
      expect(mock.getUniqProviders([obj, obj, Provider2])).toEqual([obj, Provider2]);
    });

    it('case 5', () => {
      const obj = { provide: Provider1, useValue: '' };
      expect(mock.getUniqProviders([obj, obj, Provider1])).toEqual([Provider1]);
    });

    it('case 6', () => {
      const obj = { provide: Provider1, useValue: '' };
      expect(mock.getUniqProviders([obj, Provider1, obj])).toEqual([obj]);
    });
  });
});
