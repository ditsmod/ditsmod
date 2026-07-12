import { featureModule } from '@ditsmod/core';
import { HttpErrorHandler, RestRouteExtension, DispatcherExtension } from '@ditsmod/rest';

import { SentryHttpErrorHandler } from './sentry.http-error-handler.js';
import { SentryExtension } from './sentry.extension.js';

@featureModule({
  providersPerRou: [{ token: HttpErrorHandler, useClass: SentryHttpErrorHandler }],
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
