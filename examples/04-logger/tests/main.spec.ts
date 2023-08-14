import request = require('supertest');
import { Providers, NodeServer } from '@ditsmod/core';
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from '../src/app/app.module';

describe('04-logger', () => {
  let server: NodeServer;

  beforeAll(async () => {
    server = await new TestApplication(AppModule)
      .setInitLogLevel('error')
      .overrideProviders([...new Providers().useLogConfig({ level: 'error' })])
      .getServer();
  });

  afterAll(() => {
    server.close();
  });

  it('should works', async () => {
    await request(server).get('/').expect(200).expect('ok');
  });

  it('should works with winston', async () => {
    await request(server).get('/winston').expect(200);
  });

  it('should works with bunyan', async () => {
    await request(server).get('/bunyan').expect(200);
  });

  it('should works with pino', async () => {
    await request(server).get('/pino').expect(200);
  });
});
