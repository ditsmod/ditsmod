import request = require('supertest');
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from '#app/app.module.js';

describe('01-hello-world', () => {
  it('controller works', async () => {
    const server = await new TestApplication(AppModule).getServer();
    await request(server)
      .get('/hello')
      .expect(200)
      .expect('Hello, World!');

    server.close();
  });

  it('controller as singleton works', async () => {
    const server = await new TestApplication(AppModule).getServer();
    await request(server)
      .get('/hello2')
      .expect(200)
      .expect('Hello, World!');

    server.close();
  });
});
