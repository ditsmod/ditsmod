import * as request from 'supertest';

import { TestApplication } from '../src/test-application';
import { AppModule } from './app/app.module';
import { Providers } from '@ditsmod/core';

describe('@ditsmod/testing', () => {
  it('controller works', async () => {
    const { server } = await new TestApplication()
      .initRootModule(AppModule)
      .overrideProviders([...new Providers().useLogConfig({ level: 'error' })])
      .bootstrapTestApplication();

    await request(server).get('/').expect(200).expect('Hello, World!\n');

    await request(server).get('/admin').expect(200).expect('Hello, admin!\n');

    server.close();
  });
});
