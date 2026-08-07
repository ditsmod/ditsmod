import { ProviderBuilder } from '@holu/core';
import { restRootModule, HttpErrorHandler, RequestDispatcher } from '@holu/rest';
import { SentryModule, SentryOptions } from '@holu/sentry';

import { ExampleController } from './example.controller.js';

@restRootModule({
  imports: [SentryModule],
  controllers: [ExampleController],
  providersPerMod: new ProviderBuilder().useValue(SentryOptions, {
    capture4xx: false, // Default is false, change to true if you want to capture 4xx client errors
  }),
  resolvedCollisionsPerApp: [[RequestDispatcher, SentryModule]],
  resolvedCollisionsPerRou: [[HttpErrorHandler, SentryModule]],
})
export class AppModule {}
