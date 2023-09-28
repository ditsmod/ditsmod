import { featureModule } from '@ditsmod/core';
import { RoutingModule } from '@ditsmod/routing';

import { SomeController } from './some.controller.js';

@featureModule({
  imports: [RoutingModule],
  controllers: [SomeController],
})
export class SomeModule {}
