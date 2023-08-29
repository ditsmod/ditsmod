import request = require('supertest');
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from '#src/app/app.module.js';


describe('17-cors', () => {
  // console.log = jest.fn(); // Hide logs

  it('simply GET request', async () => {
    const server = await new TestApplication(AppModule).getServer();
    const res = await request(server)
      .get('/')
      .expect(200)
      .expect('GET method\n')
      ;

      expect(res.headers['access-control-allow-origin']).toBeUndefined();
      expect(res.headers['access-control-allow-methods']).toBeUndefined();
      expect(res.headers['access-control-allow-headers']).toBeUndefined();
      expect(res.headers.allow).toBeUndefined();
      expect(res.headers.vary).toBeUndefined();

    server.close();
  });

  it('Simply OPTIONS request', async () => {
    const server = await new TestApplication(AppModule).getServer();
    const res = await request(server)
      .options('/')
      .expect(204)
      ;

      expect(res.headers['access-control-allow-origin']).toBeUndefined();
      expect(res.headers['access-control-allow-methods']).toBeUndefined();
      expect(res.headers['access-control-allow-headers']).toBeUndefined();
      expect(res.headers.allow).toBe('OPTIONS,GET,POST,PATCH');
      expect(res.headers.vary).toBeUndefined();

    server.close();
  });

  it('OPTIONS CORS request', async () => {
    const server = await new TestApplication(AppModule).getServer();
    const res = await request(server)
      .options('/')
      .set('Origin', 'https://example.com')
      .expect(204)
      ;

      expect(res.headers['access-control-allow-origin']).toBe('https://example.com');
      expect(res.headers['access-control-allow-methods']).toBeUndefined();
      expect(res.headers['access-control-allow-headers']).toBeUndefined();
      expect(res.headers.allow).toBe('OPTIONS,GET,POST,PATCH');
      expect(res.headers.vary).toBe('Origin');

    server.close();
  });

  it('GET CORS request', async () => {
    const server = await new TestApplication(AppModule).getServer();
    const res = await request(server)
      .get('/')
      .set('Origin', 'https://example.com')
      .expect(200)
      ;

      expect(res.headers['access-control-allow-origin']).toBe('https://example.com');
      expect(res.headers['access-control-allow-methods']).toBeUndefined();
      expect(res.headers['access-control-allow-headers']).toBeUndefined();
      expect(res.headers.allow).toBeUndefined();
      expect(res.headers.vary).toBe('Origin');

    server.close();
  });

  it('Preflighted CORS request', async () => {
    const server = await new TestApplication(AppModule).getServer();
    const res = await request(server)
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

    server.close();
  });

  it('CORS request with credentials', async () => {
    const server = await new TestApplication(AppModule).getServer();
    const res = await request(server)
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

    server.close();
  });
});
