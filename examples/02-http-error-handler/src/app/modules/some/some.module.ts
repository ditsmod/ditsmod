import { featureModule } from '@ditsmod/core';

import { SomeController } from './some.controller.js';
import { RouterModule } from '@ditsmod/router';

@featureModule({
  imports: [RouterModule],
  controllers: [SomeController],
})
export class SomeModule {}
