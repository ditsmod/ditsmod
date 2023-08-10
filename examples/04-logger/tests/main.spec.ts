import request = require('supertest');
import { Providers, Server } from '@ditsmod/core';
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from '../src/app/app.module';

describe('04-logger', () => {
  let server: Server;

  beforeEach(async () => {
    const obj = await new TestApplication(AppModule)
      .setLogLevelForInit('error')
      .overrideProviders([...new Providers().useLogConfig({ level: 'error' })])
      .bootstrapTestApplication();

    server = obj.server;
  });

  it('should works', async () => {
    await request(server).get('/').expect(200).expect('ok');

    server.close();
  });

  it('should works with winston', async () => {
    await request(server).get('/winston').expect(200);

    server.close();
  });

  it('should works with bunyan', async () => {
    await request(server).get('/bunyan').expect(200);

    server.close();
  });

  it('should works with pino', async () => {
    await request(server).get('/pino').expect(200);

    server.close();
  });
});
