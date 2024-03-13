import request = require('supertest');
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from '#app/app.module.js';


describe('18-return', () => {
  // console.log = jest.fn(); // Hide logs

  it('regular controller', async () => {
    const server = await new TestApplication(AppModule).getServer();
    await request(server)
      .get('/first')
      .expect(200)
      .expect('first module.\n')
      ;

    await request(server)
      .get('/second')
      .expect(200)
      .expect('default send')
      ;

    await request(server)
      .get('/second-json')
      .expect(200)
      .expect({ msg: 'JSON object' })
      ;

    await request(server)
      .get('/second-string')
      .expect(200)
      .expect('Some string')
      ;

    server.close();
  });

  it('singleton controller', async () => {
    const server = await new TestApplication(AppModule).getServer();

    await request(server)
      .get('/second2')
      .expect(200)
      .expect('default2 send')
      ;

    await request(server)
      .get('/second2-json')
      .expect(200)
      .expect({ msg: 'JSON2 object' })
      ;

    await request(server)
      .get('/second2-string')
      .expect(200)
      .expect('Some2 string')
      ;

    server.close();
  });
});
