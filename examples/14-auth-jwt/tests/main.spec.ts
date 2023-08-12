import request = require('supertest');
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from '../src/app/app.module';


describe('14-auth-jwt', () => {
  console.log = jest.fn(); // Hide logs

  it('controller works', async () => {
    const server = await new TestApplication(AppModule).getServer();
    await request(server)
      .get('/')
      .expect(200)
      .expect('Hello World!\n');

    const response = await request(server)
      .get('/get-token-for/Kostia')
      .expect(200);

    await request(server)
      .get('/profile')
      .expect(401);

    await request(server)
      .get('/profile')
      .set('Authorization', `Bearer ${response.text}`)
      .expect(200)
      .expect('Hello, Kostia! You have successfully authorized.')
      ;


    server.close();
  });
});
