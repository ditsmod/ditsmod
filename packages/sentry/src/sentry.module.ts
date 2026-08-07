import { featureModule } from '@holu/core';
import { HttpErrorHandler, RestRouteExtension, DispatcherExtension, RequestDispatcher } from '@holu/rest';

import { SentryHttpErrorHandler } from './sentry.http-error-handler.js';
import { SentryExtension } from './sentry.extension.js';
import { SentryRequestDispatcher } from './sentry-request-dispatcher.js';

@featureModule({
  providersPerApp: [SentryRequestDispatcher, { token: RequestDispatcher, useToken: SentryRequestDispatcher }],
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
