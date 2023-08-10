import request = require('supertest');
import { Application } from '@ditsmod/core';

import { AppModule } from '../src/app/app.module';


describe('08-http-interceptors', () => {
  console.log = jest.fn(); // Hide logs

  it('controller works', async () => {
    const { server } = await new Application().bootstrap(AppModule, false);
    await request(server)
      .get('/')
      .expect(200)
      .expect('Hello World!\n');

    server.close();
  });
});
