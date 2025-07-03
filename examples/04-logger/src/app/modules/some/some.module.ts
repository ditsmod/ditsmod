import { featureModule, Providers } from '@ditsmod/core';
import { RestModule } from '@ditsmod/rest';

import { SomeController } from './some.controller.js';

@featureModule({
  imports: [RestModule],
  controllers: [SomeController],
  providersPerMod: new Providers().useLogConfig({ level: 'trace' }),
})
export class SomeModule {}
