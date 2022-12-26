import 'reflect-metadata';
import request from 'supertest';
import { Application } from '@ditsmod/core';

import { AppModule } from '../src/app/app.module';


describe('19-session-cookie', () => {
  // console.log = jest.fn(); // Hide logs

  it('should set cookie', async () => {
    const { server } = await new Application().bootstrap(AppModule, false);
    await request(server)
      .get('/set')
      .expect(200)
      .expect('set-cookie', /custom-session-name=123/)
      .expect(`Hello World!\n`)
      ;

    server.close();
  });

  it('should read cookie', async () => {
    const { server } = await new Application().bootstrap(AppModule, false);
    await request(server)
      .get('/get')
      .set('cookie', 'custom-session-name=123')
      .expect(200)
      .expect(`session ID: 123`)
      ;

    server.close();
  });
});
