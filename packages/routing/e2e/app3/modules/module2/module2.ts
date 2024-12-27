import { featureModule } from '@ditsmod/core';
import { RoutingModule } from '@ditsmod/routing';

import { Controller1, Controller2, Controller3, Controller4 } from './controllers.js';
import { Guard, GuardPerRou, OtherGuard, OtherGuardPerRou } from '../../guards.js';

@featureModule({
  imports: [RoutingModule],
  providersPerRou: [
    { token: Guard, useClass: GuardPerRou },
    { token: OtherGuard, useClass: OtherGuardPerRou },
  ],
  providersPerReq: [Guard, OtherGuard],
  controllers: [Controller1, Controller2, Controller3, Controller4],
})
export class Module2 {}
