import { ModRefId, NormalizedMeta, Provider, Providers } from '@ditsmod/core';
import { describe, expect, it } from 'vitest';

import { TestAppInitializer } from '#app/test-app-initializer.js';
import { Meta } from '#app/types.js';

describe('TestAppInitializer', () => {
  class MockTestAppInitializer extends TestAppInitializer {
    override providersMetaForAdding = new Map<ModRefId, Meta<Provider[]>>();

    override overrideMetaAfterStage1(meta: NormalizedMeta) {
      return super.overrideMetaAfterStage1(meta);
    }
  }
  const mock = new MockTestAppInitializer(null as any, null as any, null as any);

  describe('addProvidersToModule()', () => {
    it('adding instanse of Providers to providersPerApp', () => {
      const modRefId = {} as ModRefId;
      class Provider1 {}

      const providersMeta1: Meta = {
        providersPerApp: [Provider1],
        providersPerMod: [Provider1],
      };
      mock.addProvidersToModule(modRefId, providersMeta1);
      expect(mock.providersMetaForAdding.get(modRefId)?.providersPerApp).toEqual([Provider1]);
      expect(mock.providersMetaForAdding.get(modRefId)?.providersPerMod).toEqual([Provider1]);
    });

    it('adding mix (Provider[] and instanse of Providers) to providersPerApp', () => {
      const modRefId = {} as ModRefId;
      class Provider1 {}
      class Provider2 {}

      const providersMeta1: Meta = {
        providersPerApp: [Provider1],
      };

      const providersMeta2: Meta = {
        providersPerApp: new Providers().passThrough(Provider2),
      };
      mock.addProvidersToModule(modRefId, providersMeta1);
      mock.addProvidersToModule(modRefId, providersMeta2);
      expect(mock.providersMetaForAdding.get(modRefId)?.providersPerApp).toEqual([Provider1, Provider2]);
    });
  });

  describe('overrideMetaAfterStage1()', () => {
    it('adding providers to meta', () => {
      const modRefId = {} as ModRefId;
      const fakeModRefId = {} as ModRefId;
      class Provider0 {}
      class Provider1 {}

      const providersMeta1: Meta = {
        providersPerApp: [Provider1],
        providersPerMod: [Provider1],
      };
      mock.addProvidersToModule(modRefId, providersMeta1);
      const meta = new NormalizedMeta();
      meta.providersPerApp.push(Provider0);
      meta.providersPerMod.push(Provider0);

      meta.modRefId = fakeModRefId;
      mock.overrideMetaAfterStage1(meta);
      expect(meta.providersPerApp).toEqual([Provider0]);
      expect(meta.providersPerMod).toEqual([Provider0]);

      meta.modRefId = modRefId;
      mock.overrideMetaAfterStage1(meta);
      expect(meta.providersPerApp).toEqual([Provider0, Provider1]);
      expect(meta.providersPerMod).toEqual([Provider0, Provider1]);
    });
  });
});
