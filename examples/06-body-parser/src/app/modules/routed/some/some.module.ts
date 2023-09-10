import { featureModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { SomeController } from './some.controller.js';

@featureModule({
  imports: [RouterModule],
  controllers: [SomeController],
})
export class SomeModule {
}
