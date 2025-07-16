import { featureModule } from '@ditsmod/core';
import { initRest, RestModule } from '@ditsmod/rest';

import { Controller1, Controller2 } from './controllers.js';
import { Guard, GuardPerRou } from '../../guards.js';

@initRest({
  providersPerRou: [{ token: Guard, useClass: GuardPerRou }],
  providersPerReq: [Guard],
  controllers: [Controller1, Controller2],
})
@featureModule({
  imports: [RestModule],
})
export class Module1 {}
