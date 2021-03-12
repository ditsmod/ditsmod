import { getUniqProviders } from './get-uniq-providers';

describe('getUniqProviders()', () => {
  it('case 1', () => {
    class Provider1 {}
    class Provider2 {}
    expect(getUniqProviders([Provider1, Provider1, Provider2])).toEqual([Provider1, Provider2]);
  });

  it('case 2', () => {
    class Provider1 {}
    class Provider2 {}
    const obj = { provide: Provider1, useValue: '' };
    expect(getUniqProviders([obj, Provider1, Provider2])).toEqual([Provider1, Provider2]);
  });

  it('case 3', () => {
    class Provider1 {}
    class Provider2 {}
    const obj = { provide: Provider1, useValue: '' };
    expect(getUniqProviders([Provider1, obj, Provider2])).toEqual([obj, Provider2]);
  });

  it('case 4', () => {
    class Provider1 {}
    class Provider2 {}
    const obj = { provide: Provider1, useValue: '' };
    expect(getUniqProviders([obj, obj, Provider2])).toEqual([obj, Provider2]);
  });

  it('case 5', () => {
    class Provider1 {}
    const obj = { provide: Provider1, useValue: '' };
    expect(getUniqProviders([obj, obj, Provider1])).toEqual([Provider1]);
  });

  it('case 6', () => {
    class Provider1 {}
    const obj = { provide: Provider1, useValue: '' };
    expect(getUniqProviders([obj, Provider1, obj])).toEqual([obj]);
  });
});
