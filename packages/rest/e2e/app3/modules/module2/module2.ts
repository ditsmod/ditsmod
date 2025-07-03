import { featureModule } from '@ditsmod/core';
import { RestModule } from '@ditsmod/rest';

import { Controller1, Controller2, Controller3, Controller4 } from './controllers.js';
import { Guard, GuardPerRou, OtherGuard, OtherGuardPerRou } from '../../guards.js';

@featureModule({
  imports: [RestModule],
  providersPerRou: [
    { token: Guard, useClass: GuardPerRou },
    { token: OtherGuard, useClass: OtherGuardPerRou },
  ],
  providersPerReq: [Guard, OtherGuard],
  controllers: [Controller1, Controller2, Controller3, Controller4],
})
export class Module2 {}
