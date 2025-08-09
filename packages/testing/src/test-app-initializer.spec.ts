import { ModRefId, BaseMeta, Providers, Provider } from '@ditsmod/core';
import { RestInitMeta, initRest } from '@ditsmod/rest';

import { TestAppInitializer } from '#app/test-app-initializer.js';
import { ProvidersOnly } from '#app/types.js';

describe('TestAppInitializer', () => {
  class MockTestAppInitializer extends TestAppInitializer {
    override mAdditionalProviders = new Map<ModRefId, ProvidersOnly<Provider[]>>();

    override overrideMetaAfterStage1(modRefId: ModRefId, providersOnly: ProvidersOnly) {
      return super.overrideMetaAfterStage1(modRefId, providersOnly);
    }
  }
  const mock = new MockTestAppInitializer(null as any, null as any, null as any);

  describe('addProvidersToModule()', () => {
    it('adding instanse of Providers to providersPerApp', () => {
      const modRefId = {} as ModRefId;
      class Provider1 {}

      const providersMeta1: ProvidersOnly = {
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

      const providersMeta1: ProvidersOnly = {
        providersPerApp: [Provider1],
      };

      const providersMeta2: ProvidersOnly = {
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

      const providersMeta1: ProvidersOnly = {
        providersPerApp: [Provider1],
        providersPerMod: [Provider1],
      };
      mock.addProvidersToModule(modRefId, providersMeta1);
      const baseMeta = new BaseMeta();
      baseMeta.initMeta.set(initRest, new RestInitMeta());
      baseMeta.providersPerApp.push(Provider0);
      baseMeta.providersPerMod.push(Provider0);

      baseMeta.modRefId = fakeModRefId;
      mock.overrideMetaAfterStage1(baseMeta.modRefId, baseMeta);
      expect(baseMeta.providersPerApp).toEqual([Provider0]);
      expect(baseMeta.providersPerMod).toEqual([Provider0]);

      baseMeta.modRefId = modRefId;
      mock.overrideMetaAfterStage1(baseMeta.modRefId, baseMeta);
      expect(baseMeta.providersPerApp).toEqual([Provider0, Provider1]);
      expect(baseMeta.providersPerMod).toEqual([Provider0, Provider1]);
    });
  });
});
