import 'reflect-metadata';
import request from 'supertest';
import { Application } from '@ditsmod/core';

import { AppModule } from '../src/app/app.module';


describe('18-return', () => {
  // console.log = jest.fn(); // Hide logs

  it('case 1', async () => {
    const { server } = await new Application().bootstrap(AppModule, false);
    await request(server)
      .get('/first')
      .expect(200)
      .expect(`first module.\n`)
      ;

    await request(server)
      .get('/second')
      .expect(200)
      .expect(`default send`)
      ;

    await request(server)
      .get('/second-json')
      .expect(200)
      .expect({ msg: 'JSON object' })
      ;

    await request(server)
      .get('/second-string')
      .expect(200)
      .expect(`Some string`)
      ;

    server.close();
  });
});
