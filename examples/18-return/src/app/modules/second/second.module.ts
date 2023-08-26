import { HttpBackend, featureModule } from '@ditsmod/core';
import { ReturnModule } from '@ditsmod/return';

import { SecondController } from './second.controller.js';

@featureModule({
  imports: [ReturnModule],
  controllers: [SecondController],
  resolvedCollisionsPerReq: [
    [HttpBackend, ReturnModule]
  ],
})
export class SecondModule {}
