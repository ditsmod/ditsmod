import { featureModule, Providers } from '@ditsmod/core';
import { RestModule, addRest } from '@ditsmod/rest';

import { SomeController } from './some.controller.js';

@addRest({ controllers: [SomeController] })
@featureModule({
  imports: [RestModule],
  providersPerMod: new Providers().useLogConfig({ level: 'trace' }),
})
export class SomeModule {}
