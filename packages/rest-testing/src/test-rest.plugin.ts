import type { Provider, ProviderBuilder } from '@ditsmod/core';
import type { RouteExtensionMeta} from '@ditsmod/rest';
import { RestRouteExtension } from '@ditsmod/rest';

import { TestRestApplication } from './test-application.js';
import type { ExtensionMetaOverrider } from './types.js';
import { TestOverrider } from './test-overrider.js';

export class TestRestPlugin extends TestRestApplication {
  overrideExtensionRestMeta(providersToOverride: ProviderBuilder | Provider[]) {
    const aProvidersToOverride: Provider[] = [...providersToOverride];
    const overrideRoutesMeta: ExtensionMetaOverrider<RouteExtensionMeta> = (extensionGroupMeta) => {
      if (!aProvidersToOverride.length) {
        return;
      }
      extensionGroupMeta.groupData?.forEach((routeExtensionMeta) => {
        routeExtensionMeta.aControllerMetadata.forEach((controllerMetadata) => {
          aProvidersToOverride.forEach((providerToOverride) => {
            TestOverrider.overrideProvider(
              [controllerMetadata.providersPerRou, controllerMetadata.providersPerReq],
              providerToOverride,
            );
          });
        });
      });
    };

    this.overrideExtensionMeta(RestRouteExtension, overrideRoutesMeta);
    return this;
  }
}
