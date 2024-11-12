import { featureModule } from '@ditsmod/core';
import { ReturnModule } from '@ditsmod/return';
import { HttpBackend } from '@ditsmod/routing';

import { SecondController, SecondSingletonController } from './second.controller.js';

@featureModule({
  imports: [ReturnModule],
  controllers: [SecondController, SecondSingletonController],
  resolvedCollisionsPerReq: [
    [HttpBackend, ReturnModule]
  ],
})
export class SecondModule {}
