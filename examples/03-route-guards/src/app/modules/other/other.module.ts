import { featureModule } from '@ditsmod/core';
import { RoutingModule } from '@ditsmod/routing';

import { SingletonController, OtherController } from './other.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@featureModule({
  imports: [RoutingModule, AuthModule],
  controllers: [OtherController, SingletonController],
})
export class OtherModule {}
