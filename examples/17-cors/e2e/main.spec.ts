import request from 'supertest';
import { HttpServer } from '@ditsmod/rest';
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from '#app/app.module.js';


describe('17-cors', () => {
  let server: HttpServer;
  let testAgent: ReturnType<typeof request>;

  beforeAll(async () => {
    server = await TestApplication.createTestApp(AppModule).getServer();
    testAgent = request(server);
  });

  afterAll(() => {
    server?.close();
  });

  it('simply GET request', async () => {
    const res = await testAgent
      .get('/')
      .expect(200)
      .expect('GET method\n')
      ;

      expect(res.headers['access-control-allow-origin']).toBeUndefined();
      expect(res.headers['access-control-allow-methods']).toBeUndefined();
      expect(res.headers['access-control-allow-headers']).toBeUndefined();
      expect(res.headers.allow).toBeUndefined();
      expect(res.headers.vary).toBeUndefined();
  });

  it('Simply OPTIONS request', async () => {
    const res = await testAgent
      .options('/')
      .expect(204)
      ;

      expect(res.headers['access-control-allow-origin']).toBeUndefined();
      expect(res.headers['access-control-allow-methods']).toBeUndefined();
      expect(res.headers['access-control-allow-headers']).toBeUndefined();
      expect(res.headers.allow).toBe('OPTIONS,GET,POST,PATCH');
      expect(res.headers.vary).toBeUndefined();
  });

  it('OPTIONS CORS request', async () => {
    const res = await testAgent
      .options('/')
      .set('Origin', 'https://example.com')
      .expect(204)
      ;

      expect(res.headers['access-control-allow-origin']).toBe('https://example.com');
      expect(res.headers['access-control-allow-methods']).toBeUndefined();
      expect(res.headers['access-control-allow-headers']).toBeUndefined();
      expect(res.headers.allow).toBe('OPTIONS,GET,POST,PATCH');
      expect(res.headers.vary).toBe('Origin');
  });

  it('GET CORS request', async () => {
    const res = await testAgent
      .get('/')
      .set('Origin', 'https://example.com')
      .expect(200)
      ;

    expect(res.headers['access-control-allow-origin']).toBe('https://example.com');
    expect(res.headers['access-control-allow-methods']).toBeUndefined();
    expect(res.headers['access-control-allow-headers']).toBeUndefined();
    expect(res.headers.allow).toBeUndefined();
    expect(res.headers.vary).toBe('Origin');
  });

  it('Preflighted CORS request', async () => {
    const res = await testAgent
      .options('/')
      .set('Origin', 'https://example.com')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'X-PINGOTHER, Content-Type')
      .expect(204)
      ;

      expect(res.headers['access-control-allow-origin']).toBe('https://example.com');
      expect(res.headers.vary).toBe('Origin, Access-Control-Request-Headers');
      expect(res.headers['access-control-allow-methods']).toBe('OPTIONS,GET,POST,PATCH');
      expect(res.headers['access-control-allow-headers']).toBe('X-PINGOTHER, Content-Type');
      expect(res.headers.allow).toBeUndefined();
  });

  it('CORS request with credentials', async () => {
    const res = await testAgent
      .get('/credentials')
      .set('Origin', 'https://example.com')
      .expect(200)
      ;

      expect(res.headers['set-cookie']).toEqual(['one=value for one; path=/; httponly']);
      expect(res.headers['access-control-allow-origin']).toBe('https://example.com');
      expect(res.headers.vary).toBe('Origin');
      expect(res.headers['access-control-allow-credentials']).toBe('true');
      expect(res.headers['access-control-allow-methods']).toBeUndefined();
      expect(res.headers['access-control-allow-headers']).toBeUndefined();
      expect(res.headers.allow).toBeUndefined();
  });
});
