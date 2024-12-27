import { featureModule } from '@ditsmod/core';
import { RoutingModule } from '@ditsmod/routing';

import { Controller1, Controller2 } from './controllers.js';

@featureModule({
  imports: [RoutingModule],
  controllers: [Controller1, Controller2],
})
export class Module1 {}
