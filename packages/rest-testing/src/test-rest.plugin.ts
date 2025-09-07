import { Provider, Providers } from '@ditsmod/core';
import { MetadataPerMod3, RoutesExtension } from '@ditsmod/rest';
import { TestApplication, ExtensionMetaOverrider, TestOverrider } from '@ditsmod/testing';

export class TestRestPlugin extends TestApplication {
  overrideExtensionRestMeta(providersToOverride: Providers | Provider[]) {
    const aProvidersToOverride: Provider[] = [...providersToOverride];
    const overrideRoutesMeta: ExtensionMetaOverrider<MetadataPerMod3> = (stage1ExtensionMeta) => {
      if (!aProvidersToOverride.length) {
        return;
      }
      stage1ExtensionMeta.groupData?.forEach((metadataPerMod3) => {
        metadataPerMod3.aControllerMetadata.forEach((controllerMetadata) => {
          aProvidersToOverride.forEach((providerToOverride) => {
            TestOverrider.overrideProvider(
              [controllerMetadata.providersPerRou, controllerMetadata.providersPerReq],
              providerToOverride,
            );
          });
        });
      });
    };

    this.overrideExtensionMeta(RoutesExtension, overrideRoutesMeta);
    return this;
  }
}
