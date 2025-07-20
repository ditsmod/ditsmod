import { featureModule } from '@ditsmod/core';
import { initRest } from '@ditsmod/rest';

import { SomeController, SomeCtxController } from './some.controller.js';

@initRest({ controllers: [SomeController, SomeCtxController] })
@featureModule()
export class SomeModule {}
