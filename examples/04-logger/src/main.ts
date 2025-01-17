import { Application } from '@ditsmod/routing';
import { AppModule } from './app/app.module.js';

const app = await Application.create(AppModule, { bufferLogs: true, loggerConfig: { level: 'info' } });
app.server.listen(3000, '0.0.0.0');
