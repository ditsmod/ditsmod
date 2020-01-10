import { Router as RestifyRouter } from '@restify-ts/router';

import { ApplicationOptions, Logger, Router } from '../../src/types';
import { SomeService } from '../app/services/some.service';

const logger = { debug: (...args: any[]) => console.log(...args) };

export const appConfig: ApplicationOptions = {
  providersPerApp: [
    // Comment need only for good format by prettier
    SomeService,
    { provide: Logger, useValue: logger },
    { provide: Router, useClass: RestifyRouter }
  ]
};
