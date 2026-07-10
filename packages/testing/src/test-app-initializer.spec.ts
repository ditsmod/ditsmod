import type { ModRefId, Provider } from '@ditsmod/core';
import { NormalizedModuleMeta, Providers } from '@ditsmod/core';
import { RestInitMeta, initRest } from '@ditsmod/rest';

import { TestAppInitializer } from '#app/test-app-initializer.js';
import type { ProvidersByLevel } from '#app/types.js';

describe('TestAppInitializer', () => {
  class MockTestAppInitializer extends TestAppInitializer {
    override mAdditionalProviders = new Map<ModRefId, ProvidersByLevel<Provider[]>>();

    override overrideMetaAfterStage1(modRefId: ModRefId, providersByLevel: NormalizedModuleMeta) {
      return super.overrideMetaAfterStage1(modRefId, providersByLevel);
    }
  }
  const mock = new MockTestAppInitializer(null as any, null as any, null as any);

  describe('addProvidersToModule()', () => {
    it('adding instanse of Providers to providersPerApp', () => {
      const modRefId = {} as ModRefId;
      class Provider1 {}

      const providersMeta1: Partial<ProvidersByLevel> = {
        providersPerApp: [Provider1],
        providersPerMod: [Provider1],
      };
      mock.addProvidersToModule(modRefId, providersMeta1);
      expect(mock.mAdditionalProviders.get(modRefId)?.providersPerApp).toEqual([Provider1]);
      expect(mock.mAdditionalProviders.get(modRefId)?.providersPerMod).toEqual([Provider1]);
    });

    it('adding mix (Provider[] and instanse of Providers) to providersPerApp', () => {
      const modRefId = {} as ModRefId;
      class Provider1 {}
      class Provider2 {}

      const providersMeta1: Partial<ProvidersByLevel> = {
        providersPerApp: [Provider1],
      };

      const providersMeta2: Partial<ProvidersByLevel> = {
        providersPerApp: new Providers().passThrough(Provider2),
      };
      mock.addProvidersToModule(modRefId, providersMeta1);
      mock.addProvidersToModule(modRefId, providersMeta2);
      expect(mock.mAdditionalProviders.get(modRefId)?.providersPerApp).toEqual([Provider1, Provider2]);
    });
  });

  describe('overrideMetaAfterStage1()', () => {
    it('adding providers to meta', () => {
      const modRefId = {} as ModRefId;
      const fakeModRefId = {} as ModRefId;
      class Provider0 {}
      class Provider1 {}

      const providersMeta1: Partial<ProvidersByLevel> = {
        providersPerApp: [Provider1],
        providersPerMod: [Provider1],
      };
      mock.addProvidersToModule(modRefId, providersMeta1);
      const normalizedModuleMeta = new NormalizedModuleMeta();
      normalizedModuleMeta.initMeta.set(initRest, new RestInitMeta());
      normalizedModuleMeta.providersPerApp.push(Provider0);
      normalizedModuleMeta.providersPerMod.push(Provider0);

      normalizedModuleMeta.modRefId = fakeModRefId;
      mock.overrideMetaAfterStage1(normalizedModuleMeta.modRefId, normalizedModuleMeta);
      expect(normalizedModuleMeta.providersPerApp).toEqual([Provider0]);
      expect(normalizedModuleMeta.providersPerMod).toEqual([Provider0]);

      normalizedModuleMeta.modRefId = modRefId;
      mock.overrideMetaAfterStage1(normalizedModuleMeta.modRefId, normalizedModuleMeta);
      expect(normalizedModuleMeta.providersPerApp).toEqual([Provider0, Provider1]);
      expect(normalizedModuleMeta.providersPerMod).toEqual([Provider0, Provider1]);
    });
  });
});
