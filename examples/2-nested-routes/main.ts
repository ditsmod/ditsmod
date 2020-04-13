import 'reflect-metadata';
import { AppFactory } from '@ts-stack/mod';

import { AppModule } from './app/app.module';

new AppFactory()
  .bootstrap(AppModule)
  .then((server) => server.on('error', (err) => console.error(err)))
  .catch((err) => console.log(err));
