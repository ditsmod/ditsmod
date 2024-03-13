import request = require('supertest');
import { TestApplication } from '@ditsmod/testing';
import { jest } from '@jest/globals';

import { AppModule } from '#app/app.module.js';


describe('15-i18n', () => {

  it('controller works', async () => {
    const server = await new TestApplication(AppModule).getServer();
    await request(server)
      .get('/first?lng=en')
      .expect(200)
      .expect('one, two, three');

      await request(server)
      .get('/first?lng=pl')
      .expect(200)
      .expect('nie, dwa, trzy');

      await request(server)
      .get('/first-extended?lng=en')
      .expect(200)
      .expect('overrided: one, two, three');

      await request(server)
      .get('/first-extended?lng=pl')
      .expect(200)
      .expect('nie, dwa, trzy');

      await request(server)
      .get('/first-extended?lng=uk')
      .expect(200)
      .expect('extended: один, два, три');

      await request(server)
      .get('/second/Kostia?lng=en')
      .expect(200)
      .expect('Hello, Kostia!');

      await request(server)
      .get('/second/Kostia?lng=uk')
      .expect(200)
      .expect('Привіт, Kostia!');

      await request(server)
      .get('/third?lng=en')
      .expect(200)
      .expect('one, two, three');

      await request(server)
      .get('/third?lng=pl')
      .expect(200)
      .expect('nie, dwa, trzy');

    server.close();
  });
});
