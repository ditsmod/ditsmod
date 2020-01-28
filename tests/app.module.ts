import { Router as RestifyRouter } from '@restify-ts/router';

import { RootModule } from '../src/types/decorators';
import { HelloWorldController } from './app/controllers/hello-world.controller';
import { ParamsController } from './app/controllers/params.controller';
import { AppLogger } from './app/loggers/app.logger';
import { Logger, Router } from '../src/types/types';
import { SomeModule } from './app/modules/routed/some/some.module';

@RootModule({
  imports: [SomeModule],
  controllers: [HelloWorldController, ParamsController],
  providersPerApp: [
    { provide: Logger, useClass: AppLogger },
    { provide: Router, useClass: RestifyRouter }
  ],
  providersPerMod: [],
  providersPerReq: []
})
export class AppModule {}
