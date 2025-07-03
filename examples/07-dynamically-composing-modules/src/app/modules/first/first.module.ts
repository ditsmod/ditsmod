import { featureModule } from '@ditsmod/core';
import { RestModule } from '@ditsmod/rest';

import { FirstController } from './first.controller.js';

@featureModule({
  imports: [RestModule],
  controllers: [FirstController],
})
export class FirstModule {}
