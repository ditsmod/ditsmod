import { featureModule, Router } from '@ditsmod/core';

import { DefaultRouter } from './router.js';
import { RouterLogMediator } from './router-log-mediator.js';

/**
 * Sets `Router` provider on application scope.
 */
@featureModule({
  providersPerApp: [{ token: Router, useClass: DefaultRouter }, RouterLogMediator],
})
export class RouterModule {}
