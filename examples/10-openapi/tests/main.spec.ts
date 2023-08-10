import request = require('supertest');
import { Application } from '@ditsmod/core';

import { AppModule } from '../src/app/app.module';


describe('10-openapi', () => {
  console.log = jest.fn(); // Hide logs

  it('controller works', async () => {
    const { server } = await new Application().bootstrap(AppModule, false);
    await request(server)
      .get('/')
      .expect(200)
      .expect('Hello World!\n');

    server.close();
  });

  it('controller works', async () => {
    const { server } = await new Application().bootstrap(AppModule, false);
    await request(server)
      .get('/resource/123')
      .expect(200)
      .expect({ resourceId: '123', body: 'some body for resourceId 123' });

    server.close();
  });

  it('guard works', async () => {
    const { server } = await new Application().bootstrap(AppModule, false);
    await request(server)
      .get('/second')
      .expect(401);

    server.close();
  });
});
