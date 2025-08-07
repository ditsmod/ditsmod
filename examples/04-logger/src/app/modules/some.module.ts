import { featureModule, Providers } from '@ditsmod/core';
import { initRest } from '@ditsmod/rest';

import { SomeController } from './some/some.controller.js';

@initRest({ providersPerMod: new Providers().useLogConfig({ level: 'trace' }), controllers: [SomeController] })
@featureModule()
export class SomeModule {}
