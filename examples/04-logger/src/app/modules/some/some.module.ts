import { featureModule, Providers } from '@ditsmod/core';
import { RoutingModule } from '@ditsmod/routing';

import { SomeController } from './some.controller.js';

@featureModule({
  imports: [RoutingModule],
  controllers: [SomeController],
  providersPerMod: [
    ...new Providers().useLogConfig({ level: 'trace' })
  ],
})
export class SomeModule {}
