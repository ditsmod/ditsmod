import { featureModule } from '@ditsmod/core';
import { RoutingModule } from '@ditsmod/routing';

import { SomeController } from './some.controller.js';
import { SingletonController } from './singleton-some.controller.js';

@featureModule({
  imports: [RoutingModule],
  controllers: [SomeController, SingletonController],
})
export class SomeModule {
}
