import { TestApplication } from '@ditsmod/testing';

import { AppModule } from './app/app.module';

new Application().bootstrap(AppModule).catch((err) => {
  console.log(err);
});
