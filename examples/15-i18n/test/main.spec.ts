import 'reflect-metadata';
import request from 'supertest';
import { describe, it, jest } from '@jest/globals';
import { Application } from '@ditsmod/core';

import { AppModule } from '../src/app/app.module';


describe('15-i18n', () => {
  console.log = jest.fn(); // Hide logs

  it('works controller', async () => {
    const { server } = await new Application().bootstrap(AppModule, false);
    await request(server)
      .get('/first?lng=en')
      .expect(200)
      .expect(`one, two, three`);

      await request(server)
      .get('/first?lng=pl')
      .expect(200)
      .expect(`nie, dwa, trzy`);

      await request(server)
      .get('/first-extended?lng=en')
      .expect(200)
      .expect(`overrided: one, two, three`);

      await request(server)
      .get('/first-extended?lng=pl')
      .expect(200)
      .expect(`nie, dwa, trzy`);

      await request(server)
      .get('/first-extended?lng=uk')
      .expect(200)
      .expect(`extended: один, два, три`);

      await request(server)
      .get('/second/Kostia?lng=en')
      .expect(200)
      .expect(`Hello, Kostia!`);

      await request(server)
      .get('/second/Kostia?lng=uk')
      .expect(200)
      .expect(`Привіт, Kostia!`);

      await request(server)
      .get('/third?lng=en')
      .expect(200)
      .expect(`one, two, three`);

      await request(server)
      .get('/third?lng=pl')
      .expect(200)
      .expect(`nie, dwa, trzy`);

    server.close();
  });
});
