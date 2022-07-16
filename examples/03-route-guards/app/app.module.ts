import { RootModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { SomeModule } from './modules/some/some.module';
import { AuthModule } from './modules/auth/auth.module';

@RootModule({
  imports: [RouterModule, AuthModule, { path: '', module: SomeModule }],
  exports: [AuthModule],
})
export class AppModule {}
