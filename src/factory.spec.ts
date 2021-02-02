import { Provider, Type } from '@ts-stack/di';

import { ModuleWithOptions } from './decorators/module';
import { RootModule } from './decorators/root-module';
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

    getRawModuleMetadata(modOrObject: Type<any> | ModuleWithOptions<any>, isRoot?: boolean) {
      return super.getRawModuleMetadata(modOrObject, isRoot);
    }
  }

  let mock: MockFactory;

  beforeEach(() => {
    mock = new MockFactory();
  });

  describe('getRawModuleMetadata()', () => {
    it('should returns AppModule metadata', () => {
      @RootModule({ controllers: [Provider1] })
      class AppModule {}
      const metadata = mock.getRawModuleMetadata(AppModule, true);
      expect(metadata).toEqual(new RootModule({ controllers: [Provider1] }));
    });

    it('should not returns any metadata', () => {
      const metadata = mock.getRawModuleMetadata(Provider1, true);
      expect(metadata).toBeUndefined();
    });
  });

  describe('getTokensCollisions()', () => {
    it('should returns empty array because duplicates are indentical', () => {
      let duplTokens: any[] = [Provider1, Provider2];
      const providers: Provider[] = [Provider1, Provider2, Provider4, Provider3, Provider5, Provider2, Provider1];
      duplTokens = mock.getTokensCollisions(duplTokens, providers);
      expect(duplTokens).toEqual([]);
    });

    it('should returns array with some providers because duplicates are non indentical', () => {
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
