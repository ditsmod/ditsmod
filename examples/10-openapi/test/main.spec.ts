import 'reflect-metadata';
import request from 'supertest';
import { describe, it, jest } from '@jest/globals';
import { Application } from '@ditsmod/core';

import { AppModule } from '../src/app/app.module';


describe('08-http-interceptors', () => {
  console.log = jest.fn(); // Hide logs

  it('works controller', async () => {
    const { server } = await new Application().bootstrap(AppModule, false);
    await request(server)
      .get('/')
      .expect(200)
      .expect('Hello World!\n');

    server.close();
  });

  it('works controller', async () => {
    const { server } = await new Application().bootstrap(AppModule, false);
    await request(server)
      .get('/resource/123')
      .expect(200)
      .expect({ resourceId: '123', body: `some body for resourceId 123` });

    server.close();
  });
});
