import { featureModule } from '@ditsmod/core';
import { RoutingModule } from '@ditsmod/routing';

import { Controller1, Controller2 } from './controllers.js';
import { Guard, GuardPerRou } from '../../guards.js';

@featureModule({
  imports: [RoutingModule],
  providersPerRou: [{ token: Guard, useClass: GuardPerRou }],
  providersPerReq: [Guard],
  controllers: [Controller1, Controller2],
})
export class Module1 {}
