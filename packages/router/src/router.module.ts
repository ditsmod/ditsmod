import { featureModule, Router, PRE_ROUTER_EXTENSIONS, ROUTES_EXTENSIONS } from '@ditsmod/core';

import { DefaultRouter } from './router.js';
import { RouterLogMediator } from './router-log-mediator.js';
import { RoutesExtension } from './routes.extension.js';
import { PreRouterExtension } from './pre-router.extension.js';

/**
 * Sets `Router` provider on application scope, and adds RoutesExtension with PreRouterExtension.
 */
@featureModule({
  providersPerApp: [{ token: Router, useClass: DefaultRouter }, RouterLogMediator],
  extensions: [
    { extension: RoutesExtension, groupToken: ROUTES_EXTENSIONS, exported: true },
    { extension: PreRouterExtension, groupToken: PRE_ROUTER_EXTENSIONS, exported: true },
  ],
})
export class RouterModule {}
