import { RootModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { FirstModule } from './modules/first/first.module';
import { SecondModule } from './modules/second/second.module';

@RootModule({
  imports: [
    RouterModule,
    { path: '', module: FirstModule },
    { path: '', module: SecondModule },
  ]
})
export class AppModule {}
