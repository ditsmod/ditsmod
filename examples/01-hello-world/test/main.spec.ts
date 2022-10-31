import 'reflect-metadata';
import request from 'supertest';
import { describe, it } from '@jest/globals';
import { Application } from '@ditsmod/core';

import { AppModule } from '../src/app/app.module';


describe('01-hello-world', () => {
  it('controller works', async () => {
    const { server } = await new Application().bootstrap(AppModule, false);
    await request(server)
      .get('/')
      .expect(200)
      .expect('Hello World!');

    server.close();
  });
});
