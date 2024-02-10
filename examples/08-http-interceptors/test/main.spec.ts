import request = require('supertest');
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from '#src/app/app.module.js';

describe('08-http-interceptors', () => {
  it('controller works', async () => {
    const server = await new TestApplication(AppModule).getServer();
    await request(server)
      .get('/')
      .expect(200)
      .expect('{"originalMsg":"Original message!","msg":"message that attached by regular interceptor"}');

    server.close();
  });

  it('singleton controller works', async () => {
    const server = await new TestApplication(AppModule).getServer();
    await request(server)
      .get('/singleton')
      .expect(200)
      .expect('{"originalMsg":"Original singleton message!","msg":"message that attached by singleton interceptor"}');

    server.close();
  });
});
