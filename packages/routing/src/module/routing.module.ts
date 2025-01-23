import { featureModule } from '@ditsmod/core';

import { DefaultRouter, Router } from '#services/router.js';
import { RoutingErrorMediator } from '#services/router-error-mediator.js';
import { RoutesExtension } from '#extensions/routes.extension.js';
import { PreRouterExtension } from '#extensions/pre-router.extension.js';
import { RouteMeta } from '#types/route-data.js';
import { UseInterceptorExtension } from '#extensions/use-interceptor.extension.js';
import { RoutingModuleNormalizer } from '#module/module-normalizer.js';
import { RoutingModuleMetadata } from '#module/module-metadata.js';

/**
 * Sets `Router` provider on application level, and adds `RoutesExtension` with `PreRouterExtension`.
 */
@featureModule<RoutingModuleMetadata>({
  moduleNormalizers: [RoutingModuleNormalizer],
  providersPerApp: [{ token: Router, useClass: DefaultRouter }, RoutingErrorMediator],
  providersPerRou: [
    RouteMeta, // In fact, the provider with this token is added dynamically. This requires `ImportsResolver`.
  ],
  extensions: [
    { extension: RoutesExtension, beforeExtensions: [PreRouterExtension], exportOnly: true },
    { extension: PreRouterExtension, afterExtensions: [RoutesExtension], exportOnly: true },
    {
      extension: UseInterceptorExtension,
      afterExtensions: [RoutesExtension],
      beforeExtensions: [PreRouterExtension],
      exportOnly: true,
    },
  ],
  exports: [RouteMeta],
})
export class RoutingModule {}
