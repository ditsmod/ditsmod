import request from 'supertest';
import { Providers } from '@ditsmod/core';
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from '../src/app/app.module';

describe('04-logger', () => {
  beforeAll(() => {
    const { server } = new TestApplication()
    .initRootModule(AppModule)
    .overrideProviders([...new Providers().useLogConfig({ level: 'error' })])
    .bootstrapTestApplication();
  });

  it('should works', async () => {
    const { server } = await new Application().bootstrap(AppModule, false);
    await request(server)
      .get('/')
      .expect(200)
      .expect('ok');

    server.close();
  });

  it('should works with winston', async () => {
    const { server } = await new Application().bootstrap(AppModule, false);
    await request(server)
      .get('/winston')
      .expect(200);

    server.close();
  });

  it('should works with bunyan', async () => {
    const { server } = await new Application().bootstrap(AppModule, false);
    await request(server)
      .get('/bunyan')
      .expect(200);

    server.close();
  });

  it('should works with pino', async () => {
    const { server } = await new Application().bootstrap(AppModule, false);
    await request(server)
      .get('/pino')
      .expect(200);

    server.close();
  });
});
