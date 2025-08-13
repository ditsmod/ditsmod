import { RestApplication } from '@ditsmod/rest';
import { AppModule } from './app/app.module.js';

const app = await RestApplication.create(AppModule, { path: 'api' });
app.server.listen(3000, '0.0.0.0');
