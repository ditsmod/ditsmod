import { Provider, Providers } from '@ditsmod/core';
import { MetadataPerMod3, RoutesExtension } from '@ditsmod/rest';
import { TestApplication, GroupMetaOverrider, TestOverrider } from '@ditsmod/testing';

export class TestRestPlugin extends TestApplication {
  overrideGroupRestMeta(providersToOverride: Providers | Provider[]) {
    const aProvidersToOverride: Provider[] = [...providersToOverride];
    const overrideRoutesMeta: GroupMetaOverrider<MetadataPerMod3> = (stage1ExtensionMeta) => {
      if (!aProvidersToOverride.length) {
        return;
      }
      stage1ExtensionMeta.groupData?.forEach((metadataPerMod3) => {
        metadataPerMod3.aControllerMetadata.forEach((controllerMetadata) => {
          aProvidersToOverride.forEach((providerToOverride) => {
            TestOverrider.overrideProvider(['Rou', 'Req'], controllerMetadata, providerToOverride);
          });
        });
      });
    };

    this.overrideExtensionMeta(RoutesExtension, overrideRoutesMeta);
    return this;
  }
}
