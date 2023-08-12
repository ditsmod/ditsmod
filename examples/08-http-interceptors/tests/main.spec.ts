import request = require('supertest');
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from '../src/app/app.module';


describe('08-http-interceptors', () => {
  console.log = jest.fn(); // Hide logs

  it('controller works', async () => {
    const server = await new TestApplication(AppModule).getServer();
    await request(server)
      .get('/')
      .expect(200)
      .expect('Hello World!\n');

    server.close();
  });
});
