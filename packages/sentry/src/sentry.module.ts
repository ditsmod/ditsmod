import { featureModule } from '@ditsmod/core';
import { HttpErrorHandler } from '@ditsmod/rest';

import { SentryHttpErrorHandler } from './sentry.http-error-handler.js';

@featureModule({
  providersPerRou: [{ token: HttpErrorHandler, useClass: SentryHttpErrorHandler }],
})
export class SentryModule {}
