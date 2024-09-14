import { featureModule } from '@ditsmod/core';
import { RoutingModule } from '@ditsmod/routing';

import { SomeController, SomeSingletonController } from './some.controller.js';

@featureModule({
  imports: [RoutingModule],
  controllers: [SomeController, SomeSingletonController],
})
export class SomeModule {}
