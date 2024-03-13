import request = require('supertest');
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from '#app/app.module.js';

describe('16-openapi-validation', () => {

  it('endpoints works', async () => {
    const server = await new TestApplication(AppModule).getServer();

    await request(server).get('/users/Kostia').expect(200).expect({ username: 'Kostia' });

    await request(server)
      .post('/model1')
      .set('content-type', 'application/json')
      .send({ numbers: [5] })
      .expect(200)
      .expect({ numbers: [5] });

    await request(server)
      .post('/model1')
      .set('content-type', 'application/json')
      .send({})
      .expect(400)
      .expect({ error: "data must have required property 'numbers'" });

    await request(server)
      .post('/model2')
      .set('content-type', 'application/json')
      .send({ model1: { numbers: ['d'] } })
      .expect(400)
      .expect({ error: 'data/model1/numbers/0 must be number' });

    server.close();
  });
});
