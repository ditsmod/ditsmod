import type { Provider, ProviderBuilder } from '@ditsmod/core';
import type { RouteExtensionMeta} from '@ditsmod/rest';
import { RestRouteExtension } from '@ditsmod/rest';

import { TestRestApplication } from './test-application.js';
import type { ExtensionMetaOverrider } from './types.js';
import { TestOverrider } from './test-overrider.js';

export class TestRestPlugin extends TestRestApplication {
  overrideExtensionRestMeta(rawProvidersToOverride: ProviderBuilder | Provider[]) {
    const providersToOverride: Provider[] = [...rawProvidersToOverride];
    const overrideRoutesMeta: ExtensionMetaOverrider<RouteExtensionMeta> = (extensionGroupMeta) => {
      if (!providersToOverride.length) {
        return;
      }
      extensionGroupMeta.groupData?.forEach((routeExtensionMeta) => {
        routeExtensionMeta.controllersMeta.forEach((controllerMeta) => {
          providersToOverride.forEach((providerToOverride) => {
            TestOverrider.overrideProvider(
              [controllerMeta.providersPerRou, controllerMeta.providersPerReq],
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
