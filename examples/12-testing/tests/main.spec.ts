import request from 'supertest';
import { Application } from '@ditsmod/core';

import { AppModule } from '../src/app/app.module';


describe('12-testing', () => {
  console.log = jest.fn(); // Hide logs

  it('controller works', async () => {
    const { server } = await new Application().bootstrap(AppModule, false);
    await request(server)
      .get('/')
      .expect(200)
      .expect(`Hello, World!\n`);

    await request(server)
      .get('/admin')
      .expect(200)
      .expect(`Hello, admin!\n`);

    server.close();
  });
});
