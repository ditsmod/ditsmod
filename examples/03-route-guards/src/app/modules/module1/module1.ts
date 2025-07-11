import { featureModule } from '@ditsmod/core';
import { RestModule, addRest } from '@ditsmod/rest';

import { AuthModule } from '#auth';
import { InjController, CtxController } from './controllers.js';

@addRest({ controllers: [InjController, CtxController] })
@featureModule({
  imports: [RestModule, AuthModule],
})
export class Module1 {}
