import { RootModule, Router } from '@ts-stack/ditsmod';
import { DefaultRouter } from '@ts-stack/router';

import { HelloWorldController } from './hello-world.controller';

@RootModule({
  controllers: [HelloWorldController],
  providersPerApp: [{ provide: Router, useClass: DefaultRouter }]
})
export class AppModule {}
