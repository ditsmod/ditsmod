import { featureModule } from '@ditsmod/core';
import { RoutingModule } from '@ditsmod/routing';

import { AuthModule } from '#auth';
import { Controller1 } from './controller1.js';
import { Controller2 } from './controller2.js';

@featureModule({
  imports: [RoutingModule, AuthModule],
  controllers: [Controller1, Controller2],
})
export class Module1 {}
