import { Module, Router } from '@ditsmod/core';

import { DefaultRouter } from './router';
import { RouterLogMediator } from './router-log-mediator';

/**
 * Sets `Router` provider on application scope.
 */
@Module({
  providersPerApp: [{ provide: Router, useClass: DefaultRouter }, RouterLogMediator],
})
export class RouterModule {}
