import { Module, Router } from '@ditsmod/core';

import { DefaultRouter } from './router';

/**
 * Sets `Router` provider on application scope.
 */
@Module({ providersPerApp: [{ provide: Router, useClass: DefaultRouter }] })
export class RouterModule {}
