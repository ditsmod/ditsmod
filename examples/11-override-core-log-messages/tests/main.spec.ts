import request = require('supertest');
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from '../src/app/app.module';


describe('11-override-core-log-messages', () => {
  console.log = jest.fn(); // Hide logs

  it('controller works', async () => {
    const server = await new TestApplication(AppModule).getServer();
    await request(server)
      .get('/')
      .expect(200)
      .expect("I'm OtherController\n");

    server.close();
  });
});
