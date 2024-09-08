import { featureModule, Router } from '@ditsmod/core';

import { DefaultRouter } from './router.js';
import { RouterErrorMediator } from './router-error-mediator.js';
import { RoutesExtension } from './extensions/routes.extension.js';
import { PreRouterExtension } from './extensions/pre-router.extension.js';
import { ROUTES_EXTENSIONS, PRE_ROUTER_EXTENSIONS } from './types.js';

/**
 * Sets `Router` provider on application scope, and adds `RoutesExtension` with `PreRouterExtension`.
 */
@featureModule({
  providersPerApp: [{ token: Router, useClass: DefaultRouter }, RouterErrorMediator],
  extensions: [
    { extension: RoutesExtension, token: ROUTES_EXTENSIONS, exportedOnly: true },
    { extension: PreRouterExtension, token: PRE_ROUTER_EXTENSIONS, exportedOnly: true },
  ],
})
export class RoutingModule {}
