import { featureModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { FirstController } from './first.controller.js';

@featureModule({
  imports: [RouterModule],
  controllers: [FirstController],
})
export class FirstModule {}
