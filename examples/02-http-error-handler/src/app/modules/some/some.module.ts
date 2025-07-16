import { featureModule } from '@ditsmod/core';
import { RestModule, initRest } from '@ditsmod/rest';

import { SomeController, SomeCtxController } from './some.controller.js';

@initRest({ controllers: [SomeController, SomeCtxController] })
@featureModule({
  imports: [RestModule],
})
export class SomeModule {}
