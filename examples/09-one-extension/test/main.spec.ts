import request = require('supertest');
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from '@src/app/app.module.js';


describe('09-one-extension', () => {

  it('controller works', async () => {
    const server = await new TestApplication(AppModule).getServer();
    await request(server)
      .get('/')
      .expect(200)
      .expect('Hello World!\n');

    server.close();
  });
});
