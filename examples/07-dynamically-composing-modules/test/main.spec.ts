import request from 'supertest';
import { Application } from '@ditsmod/core';

import { AppModule } from '../src/app/app.module';

describe('07-dynamically-composing-modules', () => {
  console.log = jest.fn(); // Hide logs

  it('should works', async () => {
    const { server } = await new Application().bootstrap(AppModule, false);
    await request(server)
      .get('/')
      .expect(200)
      .expect('first module.\n');

    await request(server)
      .get('/get-2')
      .expect(404);

    await request(server)
      .get('/add-2')
      .expect(200)
      .expect('second successfully importing!\n');

    await request(server)
      .get('/get-2')
      .expect(200)
      .expect('second module.\n');

    await request(server)
      .get('/add-3')
      .expect(500)
      .expect({ error: 'Internal server error'});

    await request(server)
      .get('/')
      .expect(200)
      .expect('first module.\n');

    await request(server)
      .get('/get-2')
      .expect(200)
      .expect('second module.\n');

    await request(server)
      .get('/del-2')
      .expect(200)
      .expect('second successfully removing!\n');

    await request(server)
      .get('/get-2')
      .expect(404);

    await request(server)
      .get('/')
      .expect(200)
      .expect('first module.\n');

    server.close();
  });
});
