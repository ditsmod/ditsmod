import request = require('supertest');
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from '../src/app/app.module';


describe('01-hello-world', () => {
  it('controller works', async () => {
    const server = await new TestApplication(AppModule).getServer();
    await request(server)
      .get('/')
      .expect(200)
      .expect('Hello World!');

    server.close();
  });
});
