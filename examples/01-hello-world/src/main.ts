import { Application, AppOptions } from '@ditsmod/core';
import { AppModule } from './app/app.module.js';

const appOptions: AppOptions = { loggerConfig: { level: 'debug' } };
const app = await new Application().bootstrap(AppModule, appOptions);
app.server.listen(3000, '0.0.0.0');
