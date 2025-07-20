import { featureModule } from '@ditsmod/core';
import { initRest } from '@ditsmod/rest';

import { AuthModule } from '#auth';
import { InjController, CtxController } from './controllers.js';

@initRest({ controllers: [InjController, CtxController] })
@featureModule({
  imports: [AuthModule],
})
export class Module1 {}
