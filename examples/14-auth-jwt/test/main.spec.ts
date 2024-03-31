import request from 'supertest';
import { NodeServer } from '@ditsmod/core';
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from '#app/app.module.js';

describe('14-auth-jwt', () => {
  let server: NodeServer;
  let testAgent: ReturnType<typeof request>;

  beforeAll(async () => {
    server = await new TestApplication(AppModule).getServer();
    testAgent = request(server);
  });

  afterAll(() => {
    server.close();
  });

  it('controller works', async () => {
    await testAgent.get('/').expect(200).expect('Hello World!\n');

    const response = await testAgent.get('/get-token-for/Kostia').expect(200);

    await testAgent.get('/profile').expect(401);

    await testAgent
      .get('/profile')
      .set('Authorization', `Bearer ${response.text}`)
      .expect(200)
      .expect('Hello, Kostia! You have successfully authorized.');
  });
});
