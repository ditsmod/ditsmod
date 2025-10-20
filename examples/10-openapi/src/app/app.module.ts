import { restRootModule } from '@ditsmod/rest';

import { FirstModule } from '#app/modules/routed/first.module.js';
import { SecondModule } from '#app/modules/routed/second.module.js';

@restRootModule({ appends: [FirstModule, SecondModule] })
export class AppModule {}
