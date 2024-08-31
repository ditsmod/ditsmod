import request from 'supertest';
import { NodeServer } from '@ditsmod/core';
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from '#app/app.module.js';

describe('13-module-encapsulation', () => {
  let server: NodeServer;
  let testAgent: ReturnType<typeof request>;

  beforeAll(async () => {
    server = await new TestApplication(AppModule).getServer();
    testAgent = request(server);
  });

  afterAll(() => {
    server?.close();
  });

  it('controller works', async () => {
    await testAgent
      .get('/')
      .expect(200)
      .expect('per req counter: 1, per rou counter: 1');

    await testAgent
      .get('/')
      .expect(200)
      .expect('per req counter: 1, per rou counter: 2');

    await testAgent
      .get('/')
      .expect(200)
      .expect('per req counter: 1, per rou counter: 3');

    await testAgent
      .get('/first')
      .expect(200)
      .expect([{ prop: 'from FirstModule' }]);

    await testAgent
      .get('/second')
      .expect(200)
      .expect([{ prop: 'from FirstModule' }, { prop: 'from SecondModule' }]);

    await testAgent
      .get('/third')
      .expect(200)
      .expect([{ prop: 'from SecondModule' }]);
  });
});
