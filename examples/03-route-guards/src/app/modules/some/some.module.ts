import { featureModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { SomeController } from './some.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@featureModule({
  imports: [RouterModule, AuthModule],
  controllers: [SomeController],
})
export class SomeModule {}
