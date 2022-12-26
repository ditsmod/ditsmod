import { rootModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { SomeModule } from './modules/some/some.module';
import { AuthModule } from './modules/auth/auth.module';

@rootModule({
  imports: [RouterModule, AuthModule],
  appends: [SomeModule],
  exports: [AuthModule],
})
export class AppModule {}
