import request = require('supertest');
import { TestApplication } from '@ditsmod/testing';
import { NodeServer } from '@ditsmod/core';

import { AppModule } from '#app/app.module.js';

describe('06-body-parser', () => {
  let server: NodeServer;

  beforeAll(async () => {
    server = await new TestApplication(AppModule).getServer();
  });

  afterAll(() => {
    server.close();
  });

  it('should works with get', async () => {
    await request(server)
      .get('/')
      .expect(200)
      .expect('Hello, you need send POST request');
  });

  it('should parsed post', async () => {
    await request(server)
      .post('/')
      .send({ one: 1 })
      .expect(200)
      .expect({ one: 1 });
  });

  it('controller singleton should works with get', async () => {
    await request(server)
      .get('/singleton')
      .expect(200)
      .expect('Hello, you need send POST request');
  });

  it('controller singleton should parsed post', async () => {
    await request(server)
      .post('/singleton')
      .send({ one: 1 })
      .expect(200)
      .expect({ one: 1 });
  });
});
