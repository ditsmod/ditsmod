import request from 'supertest';
import { NodeServer } from '@ditsmod/core';
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from '#app/app.module.js';

describe('03-route-guards', () => {
  let server: NodeServer;
  let testAgent: ReturnType<typeof request>;

  beforeAll(async () => {
    server = await new TestApplication(AppModule).getServer();
    testAgent = request(server);
  });

  afterAll(() => {
    server.close();
  });

  it('should works', async () => {
    await testAgent.get('/hello').expect(200).expect('ok');
  });

  it('should throw 401', async () => {
    await testAgent.get('/unauth').expect(401);
  });

  it('should throw 403', async () => {
    await testAgent.get('/forbidden').expect(403);
  });

  it('should works', async () => {
    await testAgent.get('/hello2').expect(200).expect('ok');
  });

  it('should throw 401', async () => {
    await testAgent.get('/unauth2').expect(401);
  });

  it('should throw 403', async () => {
    await testAgent.get('/forbidden2').expect(403);
  });

  it('should works', async () => {
    const expectBase64 = Buffer.from(process.env.BASIC_AUTH!, 'utf8').toString('base64');

    await testAgent
      .get('/basic-auth')
      .set('Authorization', `Basic ${expectBase64}`)
      .expect(200)
      .expect('You are now authorized with BasicGuard');
  });

  it('should throw 401', async () => {
    const expectBase64 = Buffer.from('fake-string', 'utf8').toString('base64');

    await testAgent
      .get('/basic-auth')
      .set('Authorization', `Basic ${expectBase64}`).expect(401);
  });

  it('should throw 401', async () => {
    await testAgent.get('/basic-auth').expect(401);
  });
});
