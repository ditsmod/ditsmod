import { featureModule, Providers } from '@ditsmod/core';
import { initRest } from '@ditsmod/rest';

import { SomeController } from './some.controller.js';

@initRest({ controllers: [SomeController] })
@featureModule({
  providersPerMod: new Providers().useLogConfig({ level: 'trace' }),
})
export class SomeModule {}
