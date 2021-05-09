import { Module, Router } from '@ditsmod/core';

import { DefaultRouter } from './router';

@Module({ providersPerApp: [{ provide: Router, useClass: DefaultRouter }] })
export class RouterModule {}
