import { restRootModule } from '@ditsmod/rest';

import { SecondModule } from './second.module.js';
import { FirstModule } from './first.module.js';
import { ThirdModule } from './third.module.js';

@restRootModule({
  appends: [ThirdModule],
  imports: [
    { path: '', module: FirstModule },
    { path: '', module: SecondModule },
  ],
})
export class AppModule {}
