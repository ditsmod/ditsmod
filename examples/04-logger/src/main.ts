import { Application } from '@ditsmod/core';
import { AppModule } from './app/app.module.js';

const app = await Application.create(AppModule, { bufferLogs: true });
app.server.listen(3000, '0.0.0.0');
