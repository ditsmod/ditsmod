import { featureModule } from '@ditsmod/core';
import { RoutingModule } from '@ditsmod/routing';

import { Controller1, Controller2, Controller3 } from './controllers.js';
import { Guard, GuardPerRou, OtherGuard } from '../../guards.js';

@featureModule({
  imports: [RoutingModule],
  providersPerRou: [{ token: Guard, useClass: GuardPerRou }],
  providersPerReq: [Guard, OtherGuard],
  controllers: [Controller1, Controller2, Controller3],
})
export class Module2 {}
