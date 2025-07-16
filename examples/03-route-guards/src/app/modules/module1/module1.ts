import { featureModule } from '@ditsmod/core';
import { RestModule, initRest } from '@ditsmod/rest';

import { AuthModule } from '#auth';
import { InjController, CtxController } from './controllers.js';

@initRest({ controllers: [InjController, CtxController] })
@featureModule({
  imports: [RestModule, AuthModule],
})
export class Module1 {}
