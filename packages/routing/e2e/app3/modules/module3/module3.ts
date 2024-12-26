import { featureModule } from '@ditsmod/core';
import { RoutingModule } from '@ditsmod/routing';

import { Controller1 } from './controller1.js';
import { Module2 } from '../module2/module2.js';
import { AuthModule } from '../auth/auth.module.js';
import { BearerGuard } from '../auth/bearer.guard.js';

@featureModule({
  imports: [RoutingModule, AuthModule],
  appends: [{ path: '', module: Module2, guards: [BearerGuard] }],
  controllers: [Controller1],
})
export class Module3 {}
