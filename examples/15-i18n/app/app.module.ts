import { RootModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { SomeModule } from './modules/some/some.module';

@RootModule({
  imports: [RouterModule, { path: '', module: SomeModule }],
})
export class AppModule {}
