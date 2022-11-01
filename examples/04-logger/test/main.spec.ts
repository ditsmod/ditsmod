import 'reflect-metadata';
import request from 'supertest';
import { describe, it, jest, beforeAll } from '@jest/globals';
import { Application } from '@ditsmod/core';

import { AppModule } from '../src/app/app.module';

describe('04-logger', () => {
  beforeAll(() => {
    // Hide logs
    console.log = jest.fn() as any;
    process.stdout.write = jest.fn() as any;
  });

  it('should works', async () => {
    const { server } = await new Application().bootstrap(AppModule, false);
    await request(server)
      .get('/')
      .expect(200)
      .expect('ok');

    server.close();
  });

  it('should works with winston', async () => {
    const { server } = await new Application().bootstrap(AppModule, false);
    await request(server)
      .get('/winston')
      .expect(200);

    server.close();
  });

  it('should works with bunyan', async () => {
    const { server } = await new Application().bootstrap(AppModule, false);
    await request(server)
      .get('/bunyan')
      .expect(200);

    server.close();
  });

  it('should works with pino', async () => {
    const { server } = await new Application().bootstrap(AppModule, false);
    await request(server)
      .get('/pino')
      .expect(200);

    server.close();
  });
});
