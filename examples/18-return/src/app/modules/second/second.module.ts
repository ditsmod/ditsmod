import { HttpBackend, featureModule } from '@ditsmod/core';
import { RoutingModule } from '@ditsmod/routing';
import { ReturnModule } from '@ditsmod/return';

import { SecondController } from './second.controller.js';

@featureModule({
  imports: [RoutingModule, ReturnModule],
  controllers: [SecondController],
  resolvedCollisionsPerReq: [
    [HttpBackend, ReturnModule]
  ],
})
export class SecondModule {}
