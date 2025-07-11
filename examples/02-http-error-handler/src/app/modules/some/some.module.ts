import { featureModule } from '@ditsmod/core';
import { RestModule, addRest } from '@ditsmod/rest';

import { SomeController, SomeCtxController } from './some.controller.js';

@addRest({ controllers: [SomeController, SomeCtxController] })
@featureModule({
  imports: [RestModule],
})
export class SomeModule {}
