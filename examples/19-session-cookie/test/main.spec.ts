import request from 'supertest';
import { TestApplication } from '@ditsmod/testing';
import { NodeServer } from '@ditsmod/core';

import { AppModule } from '#app/app.module.js';

describe('19-session-cookie', () => {
  let server: NodeServer;
  let testAgent: ReturnType<typeof request>;

  beforeAll(async () => {
    server = await new TestApplication(AppModule).getServer();
    testAgent = request(server);
  });

  afterAll(() => {
    server.close();
  });

  describe('non-singleton', () => {
    it('should set cookie', async () => {
      await testAgent
        .get('/set')
        .expect(200)
        .expect('set-cookie', /custom-session-name=123/)
        .expect('Hello World!\n');
    });

    it('should read cookie', async () => {
      await testAgent.get('/get').set('cookie', 'custom-session-name=123').expect(200).expect('session ID: 123');
    });
  });

  describe('singleton', () => {
    it('should set cookie', async () => {
      await testAgent
        .get('/set2')
        .expect(200)
        .expect('set-cookie', /custom-session-name=123/)
        .expect('Hello World!\n');
    });

    it('should read cookie', async () => {
      await testAgent.get('/get2').set('cookie', 'custom-session-name=123').expect(200).expect('session ID: 123');
    });
  });
});
