import { Application } from '@ditsmod/core';

import { AppModule } from './app/app.module.js';

new Application().bootstrap(AppModule, { path: 'api' }).then((app) => {
  app.server.listen(3000);
});
