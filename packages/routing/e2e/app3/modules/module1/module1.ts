import { featureModule } from '@ditsmod/core';
import { RoutingModule } from '@ditsmod/routing';

import { Controller1 } from './controller1.js';
import { Controller2 } from './controller2.js';
import { AuthModule } from '../auth/auth.module.js';

@featureModule({
  imports: [RoutingModule, AuthModule],
  controllers: [Controller1, Controller2],
})
export class Module1 {}
