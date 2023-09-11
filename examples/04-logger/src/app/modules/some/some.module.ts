import { featureModule, Providers } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { SomeController } from './some.controller.js';

@featureModule({
  imports: [RouterModule],
  controllers: [SomeController],
  providersPerMod: [
    ...new Providers().useLogConfig({ level: 'trace' })
  ],
})
export class SomeModule {}
