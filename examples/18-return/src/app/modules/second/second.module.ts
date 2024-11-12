import { HttpBackend, featureModule } from '@ditsmod/core';
import { ReturnModule } from '@ditsmod/return';

import { SecondController, SecondSingletonController } from './second.controller.js';

@featureModule({
  imports: [ReturnModule],
  controllers: [SecondController, SecondSingletonController],
  resolvedCollisionsPerReq: [
    [HttpBackend, ReturnModule]
  ],
})
export class SecondModule {}
