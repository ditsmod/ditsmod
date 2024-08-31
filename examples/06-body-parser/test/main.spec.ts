import request from 'supertest';
import { TestApplication } from '@ditsmod/testing';
import { NodeServer, Providers, Status } from '@ditsmod/core';
import { BodyParserConfig } from '@ditsmod/body-parser';

import { AppModule } from '#app/app.module.js';

describe('06-body-parser', () => {
  let server: NodeServer;
  let testAgent: ReturnType<typeof request>;

  beforeAll(async () => {
    const providers = new Providers().useValue<BodyParserConfig>(BodyParserConfig, { jsonOptions: { limit: '9b' } });

    server = await new TestApplication(AppModule).overrideProviders([...providers]).getServer();
    testAgent = request(server);
  });

  afterAll(() => {
    server?.close();
  });

  it('should works with get', async () => {
    await testAgent
      .get('/')
      .expect(200)
      .expect('Hello, you need send POST request');
  });

  it('should parsed post', async () => {
    await testAgent
      .post('/')
      .set('Content-Type', 'application/json')
      .send('{"one":1}')
      .expect(200)
      .expect('{"one":1}');
  });

  it('should parsed post', async () => {
    await testAgent
      .post('/')
      .set('Content-Type', 'application/json')
      .send({ one: 1, two: 2 })
      .expect(Status.PAYLOAD_TO_LARGE);
  });

  it('should not parse fake-content-type', async () => {
    await testAgent
      .post('/')
      .set('Content-Type', 'fake-content-type')
      .send('{"one":1}')
      .expect(200)
      .expect('{}');
  });

  it('controller singleton should works with get', async () => {
    await testAgent
      .get('/singleton')
      .expect(200)
      .expect('Hello, you need send POST request');
  });

  it('controller singleton should parsed post', async () => {
    await testAgent
      .post('/singleton')
      .send({ one: 1 })
      .expect(200)
      .expect({ one: 1 });
  });

  it('controller singleton should parsed post', async () => {
    await testAgent
      .post('/singleton')
      .send({ one: 1, two: 2 })
      .expect(Status.PAYLOAD_TO_LARGE);
  });

  it('controller singleton should not parse fake-content-type', async () => {
    await testAgent
      .post('/singleton')
      .set('Content-Type', 'fake-content-type')
      .send('{"one":1}')
      .expect(200)
      .expect('{}');
  });
});
