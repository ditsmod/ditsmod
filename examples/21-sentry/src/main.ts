import { init } from '@holu/sentry';

// Initialize Sentry before bootstrapping the Holu application
init({
  dsn: 'https://00000000000000000000000000000000@o000000.ingest.sentry.io/0',
  tracesSampleRate: 1.0,
});

import { RestApplication } from '@holu/rest';
import { AppModule } from './app/app.module.js';

const app = await RestApplication.create(AppModule);
app.server.listen(3000, '0.0.0.0');
