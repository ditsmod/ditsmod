import 'reflect-metadata';
import request from 'supertest';
import { describe, it, jest } from '@jest/globals';
import { Application } from '@ditsmod/core';

import { AppModule } from '../src/app/app.module';


describe('11-override-core-log-messages', () => {
  console.log = jest.fn(); // Hide logs

  it('controller works', async () => {
    const { server } = await new Application().bootstrap(AppModule, false);
    await request(server)
      .get('/')
      .expect(200)
      .expect(`I'm OtherController\n`);

    server.close();
  });
});
