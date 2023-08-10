import request = require('supertest');
import { Application } from '@ditsmod/core';

import { AppModule } from '../src/app/app.module';

describe('03-route-guards', () => {
  console.log = jest.fn(); // Hide logs

  it('should works', async () => {
    const { server } = await new Application().bootstrap(AppModule, false);
    await request(server)
      .get('/')
      .expect(200)
      .expect('ok');

    server.close();
  });

  it('should throw 401', async () => {
    const { server } = await new Application().bootstrap(AppModule, false);
    await request(server)
      .get('/unauth')
      .expect(401);

    server.close();
  });

  it('should throw 403', async () => {
    const { server } = await new Application().bootstrap(AppModule, false);
    await request(server)
      .get('/forbidden')
      .expect(403);

    server.close();
  });
});
