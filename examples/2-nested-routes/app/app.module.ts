import { RootModule } from '@ts-stack/mod';

import { FirstModule } from './v1/first.module';
import { SecondModule } from './v2/second.module';

@RootModule({
  prefixPerApp: 'api',
  imports: [
    { prefix: 'v1', module: FirstModule },
    { prefix: 'v2', module: SecondModule },
  ],
})
export class AppModule {}
