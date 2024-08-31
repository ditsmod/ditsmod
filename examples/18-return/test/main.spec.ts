import request from 'supertest';
import { TestApplication } from '@ditsmod/testing';
import { NodeServer } from '@ditsmod/core';

import { AppModule } from '#app/app.module.js';


describe('18-return', () => {
  let server: NodeServer;
  let testAgent: ReturnType<typeof request>;

  beforeAll(async () => {
    server = await new TestApplication(AppModule).getServer();
    testAgent = request(server);
  });

  afterAll(() => {
    server?.close();
  });

  it('regular controller', async () => {
    await testAgent
      .get('/first')
      .expect(200)
      .expect('first module.\n')
      ;

    await testAgent
      .get('/second')
      .expect(200)
      .expect('default send')
      ;

    await testAgent
      .get('/second-json')
      .expect(200)
      .expect({ msg: 'JSON object' })
      ;

    await testAgent
      .get('/second-string')
      .expect(200)
      .expect('Some string')
      ;
  });

  it('singleton controller', async () => {
    await testAgent
      .get('/second2')
      .expect(200)
      .expect('default2 send')
      ;

    await testAgent
      .get('/second2-json')
      .expect(200)
      .expect({ msg: 'JSON2 object' })
      ;

    await testAgent
      .get('/second2-string')
      .expect(200)
      .expect('Some2 string')
      ;
  });
});
