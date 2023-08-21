import request = require('supertest');
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from '../src/app/app.module';


describe('13-module-encapsulation', () => {
  console.log = jest.fn(); // Hide logs

  it('controller works', async () => {
    const server = await new TestApplication(AppModule).getServer();
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
