import { featureModule } from '@ditsmod/core';
import { RoutingModule } from '@ditsmod/routing';

import { AuthModule, BearerGuard } from '#auth';
import { Controller1, OverriddenController1 } from './controller1.js';
import { Module2 } from '../module2/module2.js';

@featureModule({
  imports: [RoutingModule, AuthModule],
  appends: [{ path: '', module: Module2, guards: [BearerGuard] }],
  providersPerReq: [
    { token: Controller1.prototype.ok, useFactory: [OverriddenController1, OverriddenController1.prototype.ok] },
  ],
  controllers: [Controller1],
})
export class Module3 {}
