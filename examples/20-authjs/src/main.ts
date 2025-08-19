import { RestApplication } from '@ditsmod/rest';
import { AppModule } from './app/app.module.js';

const authSecret = process.env.AUTH_SECRET;
if (!authSecret) {
  throw new Error('You need setup AUTH_SECRET variable in ".env" file.');
}

const app = await RestApplication.create(AppModule);
app.server.listen(3000, '0.0.0.0');
