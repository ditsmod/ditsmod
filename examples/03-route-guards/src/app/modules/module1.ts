import { featureModule } from '@ditsmod/core';
import { initRest } from '@ditsmod/rest';

import { AuthModule } from '#auth';
import { InjController, CtxController } from './module1/controllers.js';

@initRest({ imports: [AuthModule], controllers: [InjController, CtxController] })
@featureModule()
export class Module1 {}
