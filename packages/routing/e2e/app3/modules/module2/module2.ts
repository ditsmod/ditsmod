import { featureModule } from '@ditsmod/core';
import { RoutingModule } from '@ditsmod/routing';

import { Controller1 } from './controller1.js';
import { Controller2 } from './controller2.js';

@featureModule({
  imports: [RoutingModule],
  controllers: [Controller1, Controller2],
})
export class Module2 {}
