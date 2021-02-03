import { RootModule, Router } from '@ts-stack/ditsmod';
import { DefaultRouter } from '@ts-stack/router';

import { FirstModule } from './v1/first.module';
import { SecondModule } from './v2/second.module';

@RootModule({
  prefixPerApp: 'api',
  imports: [
    { prefix: 'v1', module: FirstModule },
    { prefix: 'v2', module: SecondModule },
  ],
  providersPerApp: [{ provide: Router, useClass: DefaultRouter }]
})
export class AppModule {}
