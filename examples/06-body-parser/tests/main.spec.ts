import request = require('supertest');
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from '../src/app/app.module';

describe('06-body-parser', () => {
  it('should works with get', async () => {
    const server = await new TestApplication(AppModule).getServer();
    await request(server)
      .get('/')
      .expect(200)
      .expect('Hello, you need send POST request');

    server.close();
  });

  it('should parsed post', async () => {
    const server = await new TestApplication(AppModule).getServer();
    await request(server)
      .post('/')
      .send({ one: 1 })
      .expect(200)
      .expect({ one: 1 });

    server.close();
  });
});
