import { featureModule } from '@ditsmod/core';

import { DefaultRouter, Router } from './router.js';
import { RoutingErrorMediator } from './router-error-mediator.js';
import { RoutesExtension } from './extensions/routes.extension.js';
import { PreRouterExtension } from './extensions/pre-router.extension.js';
import { RouteMeta } from './route-data.js';
import { UseInterceptorExtension } from '#mod/extensions/use-interceptor.extension.js';

/**
 * Sets `Router` provider on application level, and adds `RoutesExtension` with `PreRouterExtension`.
 */
@featureModule({
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
