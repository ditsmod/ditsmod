import { Provider, Providers } from '@ditsmod/core';
import { MetadataPerMod3, RouteExtension } from '@ditsmod/rest';

import { TestRestApplication } from './test-application.js';
import { ExtensionMetaOverrider } from './types.js';
import { TestOverrider } from './test-overrider.js';

export class TestRestPlugin extends TestRestApplication {
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

    this.overrideExtensionMeta(RouteExtension, overrideRoutesMeta);
    return this;
  }
}
