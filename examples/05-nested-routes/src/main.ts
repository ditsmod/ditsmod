import { Application } from '@ditsmod/core';

import { AppModule } from './app/app.module';

new Application()
  .bootstrap(AppModule, { path: 'api' })
  .then((app) => {
    app.server.listen(3000);
  })
  .catch((err) => {
    console.log(err);
  });
