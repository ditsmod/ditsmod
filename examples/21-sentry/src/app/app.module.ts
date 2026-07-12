import { ProviderBuilder } from '@ditsmod/core';
import { restRootModule, HttpErrorHandler } from '@ditsmod/rest';
import { SentryModule, SentryOptions } from '@ditsmod/sentry';

import { ExampleController } from './example.controller.js';

@restRootModule({
  imports: [SentryModule],
  controllers: [ExampleController],
  providersPerMod: new ProviderBuilder().useValue(SentryOptions, {
    capture4xx: false, // Default is false, change to true if you want to capture 4xx client errors
  }),
  resolvedCollisionPerRou: [
    [HttpErrorHandler, SentryModule],
  ],
})
export class AppModule {}
