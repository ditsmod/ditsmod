import { featureModule } from '@ditsmod/core';

import { DefaultRouter, Router } from './router.js';
import { RoutingErrorMediator } from './router-error-mediator.js';
import { RoutesExtension } from './extensions/routes.extension.js';
import { PreRouterExtension } from './extensions/pre-router.extension.js';
import { ROUTE_EXTENSIONS, PRE_ROUTER_EXTENSIONS, USE_INTERCEPTOR_EXTENSIONS } from './constants.js';
import { RouteMeta } from './route-data.js';
import { UseInterceptorExtension } from '#mod/extensions/use-interceptor.extension.js';

/**
 * Sets `Router` provider on application scope, and adds `RoutesExtension` with `PreRouterExtension`.
 */
@featureModule({
  providersPerApp: [{ token: Router, useClass: DefaultRouter }, RoutingErrorMediator],
  providersPerRou: [
    RouteMeta, // In fact, the provider with this token is added dynamically. This requires `ImportsResolver`.
  ],
  extensions: [
    { extension: RoutesExtension, group: ROUTE_EXTENSIONS, beforeGroups: [PRE_ROUTER_EXTENSIONS], exportOnly: true },
    { extension: PreRouterExtension, group: PRE_ROUTER_EXTENSIONS, afterGroups: [ROUTE_EXTENSIONS], exportOnly: true },
    {
      extension: UseInterceptorExtension,
      group: USE_INTERCEPTOR_EXTENSIONS,
      afterGroups: [ROUTE_EXTENSIONS],
      beforeGroups: [PRE_ROUTER_EXTENSIONS],
      exportOnly: true,
    },
  ],
  exports: [RouteMeta],
})
export class RoutingModule {}
