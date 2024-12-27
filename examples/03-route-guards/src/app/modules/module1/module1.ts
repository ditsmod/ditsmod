import { featureModule } from '@ditsmod/core';
import { RoutingModule } from '@ditsmod/routing';

import { AuthModule } from '#auth';
import { InjController, CtxController } from './controllers.js';

@featureModule({
  imports: [RoutingModule, AuthModule],
  controllers: [InjController, CtxController],
})
export class Module1 {}
