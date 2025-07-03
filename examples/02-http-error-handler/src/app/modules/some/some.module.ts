import { featureModule } from '@ditsmod/core';
import { RestModule } from '@ditsmod/rest';

import { SomeController, SomeCtxController } from './some.controller.js';

@featureModule({
  imports: [RestModule],
  controllers: [SomeController, SomeCtxController],
})
export class SomeModule {}
