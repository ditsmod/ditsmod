import { Router as RestifyRouter } from '@restify-ts/router';

import { RootModule } from '../src/decorators';
import { HelloWorldController } from './app/controllers/hello-world.controller';
import { ParamsController } from './app/controllers/params.controller';
import { AppLogger } from './app/loggers/app.logger';
import { Logger, Router } from '../src/types';
import { SomeModule } from './app/modules/routed/some/some.module';

@RootModule({
  imports: [],
  controllers: [HelloWorldController],
  providersPerApp: [
    { provide: Logger, useClass: AppLogger },
    { provide: Router, useClass: RestifyRouter }
  ],
  providersPerMod: [],
  providersPerReq: []
})
export class AppModule {}
