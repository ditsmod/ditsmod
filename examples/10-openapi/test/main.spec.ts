import request = require('supertest');
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from '#app/app.module.js';


describe('10-openapi', () => {

  it('controller works', async () => {
    const server = await new TestApplication(AppModule).getServer();
    await request(server)
      .get('/')
      .expect(200)
      .expect('Hello World!\n');

    server.close();
  });

  it('controller works', async () => {
    const server = await new TestApplication(AppModule).getServer();
    await request(server)
      .get('/resource/123')
      .expect(200)
      .expect({ resourceId: '123', body: 'some body for resourceId 123' });

    server.close();
  });

  it('guard works', async () => {
    const server = await new TestApplication(AppModule).getServer();
    await request(server)
      .get('/second')
      .expect(401);

    server.close();
  });
});
