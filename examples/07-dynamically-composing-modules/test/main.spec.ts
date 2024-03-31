import request from 'supertest';
import { TestApplication } from '@ditsmod/testing';
import { NodeServer } from '@ditsmod/core';

import { AppModule } from '#app/app.module.js';

describe('07-dynamically-composing-modules', () => {
  let server: NodeServer;
  let testAgent: ReturnType<typeof request>;

  beforeAll(async () => {
    server = await new TestApplication(AppModule).getServer();
    testAgent = request(server);
  });

  afterAll(() => {
    server.close();
  });

  it('should works', async () => {
    await testAgent.get('/').expect(200).expect('first module.\n');
    await testAgent.get('/get-2').expect(501);
    await testAgent.get('/add-2').expect(200).expect('second successfully importing!\n');
    await testAgent.get('/get-2').expect(200).expect('second module.\n');
    await testAgent.get('/add-3').expect(500).expect({ error: 'Internal server error' });
    await testAgent.get('/').expect(200).expect('first module.\n');
    await testAgent.get('/get-2').expect(200).expect('second module.\n');
    await testAgent.get('/del-2').expect(200).expect('second successfully removing!\n');
    await testAgent.get('/get-2').expect(501);
    await testAgent.get('/').expect(200).expect('first module.\n');
  });
});
