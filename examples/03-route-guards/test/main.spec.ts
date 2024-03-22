import request = require('supertest');
import { NodeServer } from '@ditsmod/core';
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from '#app/app.module.js';

describe('03-route-guards', () => {
  let server: NodeServer;

  beforeAll(async () => {
    server = await new TestApplication(AppModule).getServer();
  });

  afterAll(() => {
    server.close();
  });

  it('should works', async () => {
    await request(server).get('/hello').expect(200).expect('ok');
  });

  it('should throw 401', async () => {
    await request(server).get('/unauth').expect(401);
  });

  it('should throw 403', async () => {
    await request(server).get('/forbidden').expect(403);
  });

  it('should works', async () => {
    await request(server).get('/hello2').expect(200).expect('ok');
  });

  it('should throw 401', async () => {
    await request(server).get('/unauth2').expect(401);
  });

  it('should throw 403', async () => {
    await request(server).get('/forbidden2').expect(403);
  });

  it('should works', async () => {
    const expectBase64 = Buffer.from(process.env.BASIC_AUTH!, 'utf8').toString('base64');

    await request(server)
      .get('/basic-auth')
      .set('Authorization', `Basic ${expectBase64}`)
      .expect(200)
      .expect('You are now authorized with BasicGuard');
  });

  it('should throw 401', async () => {
    const expectBase64 = Buffer.from('fake-string', 'utf8').toString('base64');

    await request(server)
      .get('/basic-auth')
      .set('Authorization', `Basic ${expectBase64}`).expect(401);
  });

  it('should throw 401', async () => {
    await request(server).get('/basic-auth').expect(401);
  });
});
