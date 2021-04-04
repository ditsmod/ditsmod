import 'reflect-metadata';
import { Application } from '@ditsmod/core';

import { AppModule } from './app/app.module';

new Application()
  .bootstrap(AppModule)
  .then(({ server, log }) => {
    server.on('error', (err) => log.error(err));
  })
  .catch(({ err, log }) => {
    log.fatal(err);
  });
