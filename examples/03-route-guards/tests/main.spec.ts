import request = require('supertest');
import { Server, Providers } from '@ditsmod/core';
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from '../src/app/app.module';

describe('03-route-guards', () => {
  let server: Server;

  beforeAll(async () => {
    server = await new TestApplication(AppModule).getServer();
  });

  afterAll(() => {
    server.close();
  });

  it('should works', async () => {
    await request(server).get('/').expect(200).expect('ok');
  });

  it('should throw 401', async () => {
    await request(server).get('/unauth').expect(401);
  });

  it('should throw 403', async () => {
    await request(server).get('/forbidden').expect(403);
  });
});
