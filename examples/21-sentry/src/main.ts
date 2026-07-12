import * as Sentry from '@sentry/node';

// Initialize Sentry before bootstrapping the Ditsmod application
Sentry.init({
  dsn: 'https://placeholder-dsn@o0.ingest.sentry.io/123',
  tracesSampleRate: 1.0,
});

import { RestApplication } from '@ditsmod/rest';
import { AppModule } from './app/app.module.js';

const app = await RestApplication.create(AppModule);
app.server.listen(3000, '0.0.0.0');
