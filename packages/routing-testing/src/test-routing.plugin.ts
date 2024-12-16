import { getToken, Provider, Providers } from '@ditsmod/core';
import { MetadataPerMod3, ROUTES_EXTENSIONS } from '@ditsmod/routing';
import { TestApplication, GroupMetaOverrider } from '@ditsmod/testing';

export class TestRoutingPlugin extends TestApplication {
  overrideGroupRoutingMeta(aProvidersToOverride: Providers | Provider[]) {
    const overrideRoutesMeta: GroupMetaOverrider<MetadataPerMod3> = (aProvidersToOverride, stage1GroupMeta) => {
      if (!aProvidersToOverride.length) {
        return;
      }
      stage1GroupMeta.groupData?.forEach((metadataPerMod3) => {
        metadataPerMod3.aControllerMetadata.forEach((controllerMetadata) => {
          aProvidersToOverride.forEach((providerToOverride) => {
            (['Rou', 'Req'] as const).forEach((scope) => {
              for (const providerOrigin of controllerMetadata[`providersPer${scope}`]) {
                const token1 = getToken(providerToOverride);
                const token2 = getToken(providerOrigin);
                if (token1 === token2) {
                  controllerMetadata[`providersPer${scope}`].push(providerToOverride);
                  break;
                }
              }
            });
          });
        });
      });
    };

    this.overrideDynamic(ROUTES_EXTENSIONS, overrideRoutesMeta, aProvidersToOverride);
    return this;
  }
}
