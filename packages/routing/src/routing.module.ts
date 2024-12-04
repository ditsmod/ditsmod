import { featureModule, Router } from '@ditsmod/core';

import { DefaultRouter } from './router.js';
import { RoutingErrorMediator } from './router-error-mediator.js';
import { RoutesExtension } from './extensions/routes.extension.js';
import { PreRouterExtension } from './extensions/pre-router.extension.js';
import { ROUTES_EXTENSIONS, PRE_ROUTER_EXTENSIONS } from './constants.js';
import { RouteMeta } from './route-data.js';

/**
 * Sets `Router` provider on application scope, and adds `RoutesExtension` with `PreRouterExtension`.
 */
@featureModule({
  providersPerApp: [{ token: Router, useClass: DefaultRouter }, RoutingErrorMediator],
  providersPerRou: [
    RouteMeta, // In fact, the provider with this token is added dynamically. This requires `ImportsResolver`.
  ],
  extensions: [
    { extension: RoutesExtension, token: ROUTES_EXTENSIONS, exportedOnly: true },
    { extension: PreRouterExtension, token: PRE_ROUTER_EXTENSIONS, exportedOnly: true },
  ],
  exports: [RouteMeta],
})
export class RoutingModule {}
