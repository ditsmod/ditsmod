import { featureModule } from '@ditsmod/core';
import { HttpErrorHandler, RestRouteExtension, DispatcherExtension } from '@ditsmod/rest';

import { SentryHttpErrorHandler } from './sentry.http-error-handler.js';
import { SentryExtension } from './sentry.extension.js';

@featureModule({
  providersPerRou: [SentryHttpErrorHandler, { token: HttpErrorHandler, useToken: SentryHttpErrorHandler }],
  exports: [SentryHttpErrorHandler, HttpErrorHandler],
  extensions: [
    {
      extension: SentryExtension,
      afterExtensions: [RestRouteExtension],
      beforeExtensions: [DispatcherExtension],
      exportOnly: true,
    },
  ],
})
export class SentryModule {}
