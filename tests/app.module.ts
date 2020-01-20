import { Router as RestifyRouter } from '@restify-ts/router';

import { RootModule } from '../src/decorators';
import { HelloWorldController } from './app/controllers/hello-world.controller';
import { ParamsController } from './app/controllers/params.controller';
import { SomeServiceController } from './app/controllers/some-service.controller';
import { AppLogger } from './app/loggers/app.logger';
import { SomeService } from './app/services/some.service';
import { Logger, Router } from '../src/types';

@RootModule({
  controllers: [HelloWorldController, ParamsController, SomeServiceController],
  providersPerApp: [
    { provide: Logger, useClass: AppLogger },
    { provide: Router, useClass: RestifyRouter }
  ],
  providersPerReq: [SomeService]
})
export class AppModule {}
