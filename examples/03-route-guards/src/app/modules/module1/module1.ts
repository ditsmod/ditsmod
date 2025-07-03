import { featureModule } from '@ditsmod/core';
import { RestModule } from '@ditsmod/rest';

import { AuthModule } from '#auth';
import { InjController, CtxController } from './controllers.js';

@featureModule({
  imports: [RestModule, AuthModule],
  controllers: [InjController, CtxController],
})
export class Module1 {}
