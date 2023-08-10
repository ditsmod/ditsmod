import request = require('supertest');
import { Application } from '@ditsmod/core';

import { AppModule } from '../src/app/app.module';


describe('02-controller-error-handler', () => {
  it('should works', async () => {
    const { server } = await new Application().bootstrap(AppModule, false);
    await request(server)
      .get('/')
      .expect(200)
      .expect('ok');

    server.close();
  });

  it('should throw an error', async () => {
    console.log = jest.fn(); // Hide logs
    const { server } = await new Application().bootstrap(AppModule, false);
    await request(server)
      .get('/throw-error')
      .expect(500);

    server.close();
  });
});
