import request from 'supertest';
import { NodeServer } from '@ditsmod/core';
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from '#app/app.module.js';

describe('16-openapi-validation', () => {
  let server: NodeServer;
  let testAgent: ReturnType<typeof request>;

  beforeAll(async () => {
    server = await new TestApplication(AppModule).getServer();
    testAgent = request(server);
  });

  afterAll(() => {
    server?.close();
  });

  it('endpoints works', async () => {
    await testAgent.get('/users/Kostia').expect(200).expect({ username: 'Kostia' });

    await testAgent
      .post('/model1')
      .set('content-type', 'application/json')
      .send({ numbers: [5] })
      .expect(200)
      .expect({ numbers: [5] });

    await testAgent
      .post('/model1')
      .set('content-type', 'application/json')
      .send({})
      .expect(400)
      .expect({ error: "data must have required property 'numbers'" });

    await testAgent
      .post('/model2')
      .set('content-type', 'application/json')
      .send({ model1: { numbers: ['d'] } })
      .expect(400)
      .expect({ error: 'data/model1/numbers/0 must be number' });
  });
});
