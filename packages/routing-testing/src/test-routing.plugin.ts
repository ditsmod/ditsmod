import { Provider, Providers } from '@ditsmod/core';
import { MetadataPerMod3, ROUTE_EXTENSIONS } from '@ditsmod/routing';
import { TestApplication, GroupMetaOverrider, TestOverrider } from '@ditsmod/testing';

export class TestRoutingPlugin extends TestApplication {
  overrideGroupRoutingMeta(providersToOverride: Providers | Provider[]) {
    const aProvidersToOverride: Provider[] = [...providersToOverride];
    const overrideRoutesMeta: GroupMetaOverrider<MetadataPerMod3> = (stage1GroupMeta) => {
      if (!aProvidersToOverride.length) {
        return;
      }
      stage1GroupMeta.groupData?.forEach((metadataPerMod3) => {
        metadataPerMod3.aControllerMetadata.forEach((controllerMetadata) => {
          aProvidersToOverride.forEach((providerToOverride) => {
            TestOverrider.overrideProvider(['Rou', 'Req'], controllerMetadata, providerToOverride);
          });
        });
      });
    };

    this.overrideExtensionMeta(ROUTE_EXTENSIONS, overrideRoutesMeta);
    return this;
  }
}
