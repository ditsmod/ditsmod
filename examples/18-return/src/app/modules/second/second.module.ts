import { HttpBackend, featureModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';
import { ReturnModule } from '@ditsmod/return';

import { SecondController } from './second.controller.js';

@featureModule({
  imports: [RouterModule, ReturnModule],
  controllers: [SecondController],
  resolvedCollisionsPerReq: [
    [HttpBackend, ReturnModule]
  ],
})
export class SecondModule {}
