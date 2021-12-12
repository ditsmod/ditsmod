import 'reflect-metadata';
import { Application } from '@ditsmod/core';

import { AppModule } from './app/app.module';

new Application()
  .bootstrap(AppModule)
  .then(({ server, logger }) => {
    server.on('error', (err) => logger.error(err));
  })
  .catch(({ err, logger }) => {
    logger.fatal(err);
  });
