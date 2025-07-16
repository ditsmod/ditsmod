import { featureModule } from '@ditsmod/core';
import { initRest, RestModule } from '@ditsmod/rest';

import { Controller1, Controller2, Controller3, Controller4 } from './controllers.js';
import { Guard, GuardPerRou, OtherGuard, OtherGuardPerRou } from '../../guards.js';

@initRest({
  providersPerRou: [
    { token: Guard, useClass: GuardPerRou },
    { token: OtherGuard, useClass: OtherGuardPerRou },
  ],
  providersPerReq: [Guard, OtherGuard],
  controllers: [Controller1, Controller2, Controller3, Controller4],
})
@featureModule({
  imports: [RestModule],
})
export class Module2 {}
