import request from 'supertest';
import { HttpServer } from '@ditsmod/rest';
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from './app.module.js';

describe('basic features of the rest module', () => {
  let server: HttpServer;
  let testAgent: ReturnType<typeof request>;

  beforeAll(async () => {
    server = await TestApplication.createTestApp(AppModule).getServer();
    testAgent = request(server);
  });

  afterAll(() => {
    server?.close();
  });

  ['injector', 'context'].forEach((scope, id) => {
    describe(`${scope}-scoped controller`, () => {
      it('GET request with path and query params', async () => {
        const { status, type, body } = await testAgent.get(`/get${id}/11/22?queryParam1=1&queryParam2=2`);
        expect(status).toBe(200);
        expect(type).toBe('application/json');
        expect(body).toEqual({
          pathParams: { pathParam1: '11', pathParam2: '22' },
          queryParams: { queryParam1: '1', queryParam2: '2' },
        });
      });

      it('GET request with headers during settings array of HTTP-methods', async () => {
        const { status, type, body } = await testAgent.get(`/get-array${id}`).set('X-header1', 'value1');
        expect(status).toBe(200);
        expect(type).toBe('application/json');
        expect(body).toMatchObject({ 'x-header1': 'value1' });
      });

      it('POST method from array of HTTP methods on the route', async () => {
        const { status, type, body } = await testAgent.post(`/get-array${id}`);
        expect(status).toBe(200);
        expect(type).toBe('application/json');
        expect(body).toMatchObject({ 'content-length': '0' });
      });

      it('controller handles HEAD method', async () => {
        const { status, type, text, headers } = await testAgent.head(`/get${id}/1/2`);
        expect(status).toBe(200);
        expect(type).toBe('application/json');
        expect(text).toBeUndefined();
        expect(headers).toMatchObject({
          'content-type': expect.stringContaining('application/json'),
          'content-length': '50',
        });
      });

      it('controller method with interceptor per route', async () => {
        const { status, text } = await testAgent.get(`/interceptor${id}`);
        expect(status).toBe(200);
        expect(text).toBe('ok');
      });
    });
  });
});
