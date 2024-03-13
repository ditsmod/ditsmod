import request = require('supertest');
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from '#app/app.module.js';

describe('19-session-cookie', () => {
  describe('non-singleton', () => {
    it('should set cookie', async () => {
      const server = await new TestApplication(AppModule).getServer();
      await request(server)
        .get('/set')
        .expect(200)
        .expect('set-cookie', /custom-session-name=123/)
        .expect('Hello World!\n');

      server.close();
    });

    it('should read cookie', async () => {
      const server = await new TestApplication(AppModule).getServer();
      await request(server).get('/get').set('cookie', 'custom-session-name=123').expect(200).expect('session ID: 123');

      server.close();
    });
  });

  describe('singleton', () => {
    it('should set cookie', async () => {
      const server = await new TestApplication(AppModule).getServer();
      await request(server)
        .get('/set2')
        .expect(200)
        .expect('set-cookie', /custom-session-name=123/)
        .expect('Hello World!\n');

      server.close();
    });

    it('should read cookie', async () => {
      const server = await new TestApplication(AppModule).getServer();
      await request(server).get('/get2').set('cookie', 'custom-session-name=123').expect(200).expect('session ID: 123');

      server.close();
    });
  });
});
