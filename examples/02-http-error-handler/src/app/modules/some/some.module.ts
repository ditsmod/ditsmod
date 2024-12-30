import { featureModule } from '@ditsmod/core';
import { RoutingModule } from '@ditsmod/routing';

import { SomeController, SomeCtxController } from './some.controller.js';

@featureModule({
  imports: [RoutingModule],
  controllers: [SomeController, SomeCtxController],
})
export class SomeModule {}
