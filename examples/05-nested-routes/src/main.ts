import { Application } from '@ditsmod/routing';
import { AppModule } from './app/app.module.js';

const app = await Application.create(AppModule, { path: 'api' });
app.server.listen(3000, '0.0.0.0');
