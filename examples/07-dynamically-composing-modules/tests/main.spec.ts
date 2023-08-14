import request = require('supertest');
import { TestApplication } from '@ditsmod/testing';
import { Providers, NodeServer } from '@ditsmod/core';

import { AppModule } from '../src/app/app.module';

describe('07-dynamically-composing-modules', () => {
  let server: NodeServer;

  beforeAll(async () => {
    server = await new TestApplication(AppModule)
      .setInitLogLevel('fatal')
      .setProvidersPerApp([...new Providers().useLogConfig({ level: 'fatal' })])
      .getServer();
  });

  afterAll(() => {
    server.close();
  });

  it('should works', async () => {
    await request(server).get('/').expect(200).expect('first module.\n');

    await request(server).get('/get-2').expect(404);

    await request(server).get('/add-2').expect(200).expect('second successfully importing!\n');

    await request(server).get('/get-2').expect(200).expect('second module.\n');

    await request(server).get('/add-3').expect(500).expect({ error: 'Internal server error' });

    await request(server).get('/').expect(200).expect('first module.\n');

    await request(server).get('/get-2').expect(200).expect('second module.\n');

    await request(server).get('/del-2').expect(200).expect('second successfully removing!\n');

    await request(server).get('/get-2').expect(404);

    await request(server).get('/').expect(200).expect('first module.\n');
  });
});
