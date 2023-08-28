import { ValueProvider } from '#di';
import { getLastProviders } from './get-last-providers.js';

describe('getLastProviders()', () => {
  it('case 1', () => {
    class Provider1 {}
    class Provider2 {}
    expect(getLastProviders([Provider1, Provider1, Provider2])).toEqual([Provider1, Provider2]);
  });

  it('case 2', () => {
    class Provider1 {}
    class Provider2 {}
    const obj = { token: Provider1, useValue: '' };
    expect(getLastProviders([obj, Provider1, Provider2])).toEqual([Provider1, Provider2]);
  });

  it('case 3', () => {
    class Provider1 {}
    class Provider2 {}
    const obj = { token: Provider1, useValue: '' };
    expect(getLastProviders([Provider1, obj, Provider2])).toEqual([obj, Provider2]);
  });

  it('case 4', () => {
    class Provider1 {}
    class Provider2 {}
    const obj = { token: Provider1, useValue: '' };
    expect(getLastProviders([obj, obj, Provider2])).toEqual([obj, Provider2]);
  });

  it('case 5', () => {
    class Provider1 {}
    const obj = { token: Provider1, useValue: '' };
    expect(getLastProviders([obj, obj, Provider1])).toEqual([Provider1]);
  });

  it('case 6', () => {
    class Provider1 {}
    const obj = { token: Provider1, useValue: '' };
    expect(getLastProviders([obj, Provider1, obj])).toEqual([obj]);
  });

  describe('Multi providers', () => {
    it('same provide and value', () => {
      class Provider1 {}
      const mp1: ValueProvider = { token: Provider1, useValue: 'one', multi: true };
      const mp2: ValueProvider = { token: Provider1, useValue: 'one', multi: true };
      const providers = [mp1, mp2];
      expect(getLastProviders(providers)).toEqual(providers);
    });

    it('same provide, but non same value', () => {
      class Provider1 {}
      const mp1: ValueProvider = { token: Provider1, useValue: 'one', multi: true };
      const mp2: ValueProvider = { token: Provider1, useValue: 'two', multi: true };
      const providers = [mp1, mp2];
      const expectedProviders = [mp1, mp2];
      expect(getLastProviders(providers)).toEqual(expectedProviders);
    });

    it('same value, but non same provide', () => {
      class Provider1 {}
      class Provider2 {}
      const mp1: ValueProvider = { token: Provider1, useValue: 'one', multi: true };
      const mp2: ValueProvider = { token: Provider2, useValue: 'one', multi: true };
      const providers = [mp1, mp2];
      const expectedProviders = [mp1, mp2];
      expect(getLastProviders(providers)).toEqual(expectedProviders);
    });

    it('mix', () => {
      class Provider1 {}
      class Provider2 {}
      const mp1: ValueProvider = { token: Provider1, useValue: 'one', multi: true };
      const mp2: ValueProvider = { token: Provider1, useValue: 'one', multi: true };
      const mp3: ValueProvider = { token: Provider1, useValue: 'two', multi: true };
      const mp4: ValueProvider = { token: Provider2, useValue: 'two', multi: true };
      const providers = [mp1, mp2, mp3, mp4];
      expect(getLastProviders(providers)).toEqual(providers);
    });
  });
});
