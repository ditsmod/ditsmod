import request from 'supertest';
import { HttpServer } from '@ditsmod/rest';
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from '#app/app.module.js';

describe('16-openapi-validation', () => {
  let server: HttpServer;
  let testAgent: ReturnType<typeof request>;

  beforeAll(async () => {
    server = await TestApplication.createTestApp(AppModule).getServer();
    testAgent = request(server);
  });

  afterAll(() => {
    server?.close();
  });

  it('case 1', async () => {
    const { status, body, type } = await testAgent.get('/users/Kostia');
    expect(status).toBe(200);
    expect(type).toBe('application/json');
    expect(body).toEqual({ username: 'Kostia' });
  });

  it('case 2', async () => {
    const { status, body, type } = await testAgent
      .post('/model1')
      .set('content-type', 'application/json')
      .send({ numbers: [5] });

    expect(status).toBe(200);
    expect(type).toBe('application/json');
    expect(body).toEqual({ numbers: [5] });
  });

  it('case 3', async () => {
    const { status, body, type } = await testAgent.post('/model1').set('content-type', 'application/json').send({});
    expect(status).toBe(400);
    expect(type).toBe('application/json');
    expect(body).toEqual({ error: "data must have required property 'numbers'" });
  });

  it('case 4', async () => {
    const { status, body, type } = await testAgent
      .post('/model2')
      .set('content-type', 'application/json')
      .send({});

    expect(status).toBe(400);
    expect(type).toBe('application/json');
    expect(body).toEqual({ error: "data must have required property 'model1'" });
  });

  it('case 5', async () => {
    const { status, body, type } = await testAgent
      .post('/model2')
      .set('content-type', 'application/json')
      .send({ model1: {} });

    expect(status).toBe(400);
    expect(type).toBe('application/json');
    expect(body).toEqual({ error: "data/model1 must have required property 'numbers'" });
  });

  it('case 6', async () => {
    const { status, body, type } = await testAgent
      .post('/model2')
      .set('content-type', 'application/json')
      .send({ model1: { numbers: ['d'] } });

    expect(status).toBe(400);
    expect(type).toBe('application/json');
    expect(body).toEqual({ error: 'data/model1/numbers/0 must be number' });
  });

  it('case 7', async () => {
    const { status, type } = await testAgent
      .post('/model2')
      .set('content-type', 'application/json')
      .send({ model1: { numbers: [5] } });

    expect(status).toBe(200);
    expect(type).toBe('application/json');
  });

  it('case 8', async () => {
    const { status, body, type } = await testAgent
      .post('/model2')
      .set('content-type', 'application/json')
      .send({ model1: { numbers: [5], username: [] } });

    expect(status).toBe(400);
    expect(type).toBe('application/json');
    expect(body).toEqual({ error: 'data/model1/username must be string' });
  });
});
