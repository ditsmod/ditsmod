import { featureModule, Providers } from '@ditsmod/core';
import { RestModule, initRest } from '@ditsmod/rest';

import { SomeController } from './some.controller.js';

@initRest({ controllers: [SomeController] })
@featureModule({
  imports: [RestModule],
  providersPerMod: new Providers().useLogConfig({ level: 'trace' }),
})
export class SomeModule {}
