import { featureModule } from '@ditsmod/core';
import { RoutingModule } from '@ditsmod/routing';

import { SingletonController, SomeController } from './some.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@featureModule({
  imports: [RoutingModule, AuthModule],
  controllers: [SomeController, SingletonController],
})
export class SomeModule {}
