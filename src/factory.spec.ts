import { Provider } from '@ts-stack/di';

import { Factory } from './factory';

describe('Factory', () => {
  describe('getUniqProviders()', () => {
    class Provider1 {}
    class Provider2 {}

    class MockFactory extends Factory {
      getUniqProviders(providers: Provider[]) {
        return super.getUniqProviders(providers);
      }
    }

    let mock: MockFactory;

    beforeEach(() => {
      mock = new MockFactory();
    });

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
