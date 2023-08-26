import { featureModule } from '@ditsmod/core';

import { SomeController } from './some.controller.js';

@featureModule({
  controllers: [SomeController],
})
export class SomeModule {}
