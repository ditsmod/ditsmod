import request = require('supertest');
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from '../src/app/app.module';


describe('12-testing', () => {
  console.log = jest.fn(); // Hide logs

  it('controller works', async () => {
    const server = await new TestApplication(AppModule).getServer();
    await request(server)
      .get('/')
      .expect(200)
      .expect('Hello, World!\n');

    await request(server)
      .get('/admin')
      .expect(200)
      .expect('Hello, admin!\n');

    server.close();
  });
});
