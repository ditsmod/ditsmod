import { RootModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { SecondModule } from './second/second.module';
import { FirstModule } from './first/first.module';

@RootModule({
  imports: [
    RouterModule,
    { path: '', module: FirstModule },
    { path: '', module: SecondModule }
  ],
})
export class AppModule {}
