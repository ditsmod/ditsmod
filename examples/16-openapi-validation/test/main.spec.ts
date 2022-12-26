import 'reflect-metadata';
import request from 'supertest';
import { Application } from '@ditsmod/core';

import { AppModule } from '../src/app/app.module';


describe('16-openapi-validation', () => {
  console.log = jest.fn(); // Hide logs

  it('controller works', async () => {
    const { server } = await new Application().bootstrap(AppModule, false);

    await request(server)
      .get('/users/Kostia')
      .expect(200)
      .expect({ username: 'Kostia' });
    
    await request(server)
      .post('/model1')
      .set('content-type', 'application/json')
      .send({"numbers": [5]})
      .expect(200)
      .expect({ numbers: [ 5 ] });
    
    await request(server)
      .post('/model1')
      .set('content-type', 'application/json')
      .send({})
      .expect(400)
      .expect({ error: "data must have required property 'numbers'" });
    
    await request(server)
      .post('/model2')
      .set('content-type', 'application/json')
      .send({"model1":{"numbers": ["d"]}})
      .expect(400)
      .expect({ error: "data/model1/numbers/0 must be number" });

    server.close();
  });
});
