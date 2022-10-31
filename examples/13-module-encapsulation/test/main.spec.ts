import 'reflect-metadata';
import request from 'supertest';
import { describe, it, jest } from '@jest/globals';
import { Application } from '@ditsmod/core';

import { AppModule } from '../src/app/app.module';


describe('13-module-encapsulation', () => {
  console.log = jest.fn(); // Hide logs

  it('controller works', async () => {
    const { server } = await new Application().bootstrap(AppModule, false);
    await request(server)
      .get('/')
      .expect(200)
      .expect(`per req counter: 1, per rou counter: 1`);

    await request(server)
      .get('/')
      .expect(200)
      .expect(`per req counter: 1, per rou counter: 2`);

    await request(server)
      .get('/')
      .expect(200)
      .expect(`per req counter: 1, per rou counter: 3`);

    await request(server)
      .get('/first')
      .expect(200)
      .expect([{ prop: 'from FirstModule' }]);

    await request(server)
      .get('/second')
      .expect(200)
      .expect([{ prop: 'from FirstModule' }, { prop: 'from SecondModule' }]);

    await request(server)
      .get('/third')
      .expect(200)
      .expect([{ prop: 'from SecondModule' }]);

    server.close();
  });
});
