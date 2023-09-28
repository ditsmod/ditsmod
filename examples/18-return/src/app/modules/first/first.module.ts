import { featureModule } from '@ditsmod/core';
import { RoutingModule } from '@ditsmod/routing';

import { FirstController } from './first.controller.js';

@featureModule({
  imports: [RoutingModule],
  controllers: [FirstController],
})
export class FirstModule {}
