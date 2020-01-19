import 'reflect-metadata';
import { AppModule } from './app.module';
import { bootstrapRootModule } from '../src/';

bootstrapRootModule(AppModule)
  .then(server => server.on('error', err => console.error(err)))
  .catch(err => console.log(err));
