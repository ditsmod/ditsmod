import { HttpBackend, featureModule } from '@ditsmod/core';
import { ReturnModule } from '@ditsmod/return';

import { SecondController } from './second.controller';

@featureModule({
  imports: [ReturnModule],
  controllers: [SecondController],
  resolvedCollisionsPerReq: [
    [HttpBackend, ReturnModule]
  ],
})
export class SecondModule {}
