import { Router as RestifyRouter } from '@restify-ts/router';

import { ApplicationOptions, Logger, Router } from '../../src/types';
import { SomeService } from '../app/services/some.service';
import { AppLogger } from '../app/loggers/app.logger';

export const appConfig: ApplicationOptions = {
  serverName: 'restify-ts',
  providersPerApp: [
    // prettier...
    SomeService,
    { provide: Logger, useClass: AppLogger },
    { provide: Router, useClass: RestifyRouter }
  ]
};
