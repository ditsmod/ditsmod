import { Application } from '@ditsmod/core';

import { AppModule } from './app/app.module';

new Application()
  .bootstrap(AppModule)
  .then((app) => {
    app.server.listen(3000, 'localhost');
  })
  .catch((err) => {
    console.log(err);
  });
