import type { RequestContext } from '@ditsmod/rest';
import { encodeUrlEncoded, toWebRequest } from './http-api-adapters.js';

describe('http-api-adapters', () => {
  describe('encodeUrlEncoded', () => {
    it('encodes flat objects', () => {
      const result = encodeUrlEncoded({ foo: 'bar', baz: 'qux' });
      expect(result).toBe('foo=bar&baz=qux');
    });

    it('encodes array values by appending multiple params', () => {
      const result = encodeUrlEncoded({ foo: ['bar', 'baz'] });
      expect(result).toBe('foo=bar&foo=baz');
    });

    it('returns empty string for empty object or undefined', () => {
      expect(encodeUrlEncoded()).toBe('');
      expect(encodeUrlEncoded({})).toBe('');
    });
  });

  describe('toWebRequest', () => {
    const origHost = process.env.HOST;

    afterEach(() => {
      if (origHost !== undefined) {
        process.env.HOST = origHost;
      } else {
        delete process.env.HOST;
      }
    });

    it('constructs Web Request with default localhost host', () => {
      delete process.env.HOST;
      const ctx = {
        protocol: 'http',
        rawReq: {
          url: '/api/auth/signin',
          method: 'GET',
          headers: { 'user-agent': 'test-agent' },
        },
      } as unknown as RequestContext;

      const req = toWebRequest(ctx);
      expect(req.url).toBe('http://localhost/api/auth/signin');
      expect(req.method).toBe('GET');
      expect(req.headers.get('user-agent')).toBe('test-agent');
    });

    it('uses rawReq.headers.host when process.env.HOST is unset', () => {
      delete process.env.HOST;
      const ctx = {
        protocol: 'http',
        rawReq: {
          url: '/api/auth/signin',
          method: 'GET',
          headers: { host: 'localhost:3000' },
        },
      } as unknown as RequestContext;

      const req = toWebRequest(ctx);
      expect(req.url).toBe('http://localhost:3000/api/auth/signin');
    });

    it('uses x-forwarded-host header when process.env.HOST is unset', () => {
      delete process.env.HOST;
      const ctx = {
        protocol: 'https',
        rawReq: {
          url: '/api/auth/callback',
          method: 'GET',
          headers: { 'x-forwarded-host': 'app.example.com' },
        },
      } as unknown as RequestContext;

      const req = toWebRequest(ctx);
      expect(req.url).toBe('https://app.example.com/api/auth/callback');
    });

    it('uses process.env.HOST and alternativeUrl when headers are empty', () => {
      process.env.HOST = '127.0.0.1:3000';
      const ctx = {
        protocol: 'https',
        rawReq: {
          url: '/original',
          method: 'GET',
          headers: {},
        },
      } as unknown as RequestContext;

      const req = toWebRequest(ctx, '/alt-path');
      expect(req.url).toBe('https://127.0.0.1:3000/alt-path');
    });

    it('prioritizes headers over process.env.HOST', () => {
      process.env.HOST = '0.0.0.0:8000';
      const ctx = {
        protocol: 'http',
        rawReq: {
          url: '/api/auth/session',
          method: 'GET',
          headers: { host: 'my-domain.com:3000' },
        },
      } as unknown as RequestContext;

      const req = toWebRequest(ctx);
      expect(req.url).toBe('http://my-domain.com:3000/api/auth/session');
    });

    it('extracts first host from comma-separated string or array in x-forwarded-host', () => {
      delete process.env.HOST;
      const ctx1 = {
        protocol: 'http',
        rawReq: {
          url: '/api/auth/session',
          method: 'GET',
          headers: { 'x-forwarded-host': 'proxy1.example.com, proxy2.example.com' },
        },
      } as unknown as RequestContext;

      expect(toWebRequest(ctx1).url).toBe('http://proxy1.example.com/api/auth/session');

      const ctx2 = {
        protocol: 'http',
        rawReq: {
          url: '/api/auth/session',
          method: 'GET',
          headers: { 'x-forwarded-host': ['array-proxy.com', 'second.com'] },
        },
      } as unknown as RequestContext;

      expect(toWebRequest(ctx2).url).toBe('http://array-proxy.com/api/auth/session');
    });

    it('uses x-forwarded-proto when present over ctx.protocol', () => {
      const ctx = {
        protocol: 'http',
        rawReq: {
          url: '/api/auth/callback',
          method: 'GET',
          headers: {
            host: 'localhost:3000',
            'x-forwarded-proto': 'https, http',
          },
        },
      } as unknown as RequestContext;

      const req = toWebRequest(ctx);
      expect(req.url).toBe('https://localhost:3000/api/auth/callback');
    });

    it('handles header arrays and filters empty headers', () => {
      const ctx = {
        protocol: 'http',
        rawReq: {
          url: '/',
          method: 'GET',
          headers: {
            'set-cookie': ['cookie1=1', 'cookie2=2', ''],
            empty: '',
            valid: 'val',
          },
        },
      } as unknown as RequestContext;

      const req = toWebRequest(ctx);
      expect(req.headers.get('valid')).toBe('val');
      expect(req.headers.get('empty')).toBeNull();
      expect(req.headers.get('set-cookie')).toBe('cookie1=1, cookie2=2');
    });

    it('sets body to undefined for GET and HEAD requests', () => {
      const ctx = {
        protocol: 'http',
        body: { key: 'value' },
        rawReq: {
          url: '/',
          method: 'GET',
          headers: {},
        },
      } as unknown as RequestContext;

      const req = toWebRequest(ctx);
      expect(req.body).toBeNull();
    });

    it('encodes body as urlencoded when content-type is form-urlencoded', async () => {
      const ctx = {
        protocol: 'http',
        body: { username: 'john', role: 'admin' },
        rawReq: {
          url: '/login',
          method: 'POST',
          headers: {
            'content-type': 'application/x-www-form-urlencoded',
          },
        },
      } as unknown as RequestContext;

      const req = toWebRequest(ctx);
      const text = await req.text();
      expect(text).toBe('username=john&role=admin');
    });

    it('encodes body as JSON for other content-types on POST', async () => {
      const ctx = {
        protocol: 'http',
        body: { username: 'john' },
        rawReq: {
          url: '/login',
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
        },
      } as unknown as RequestContext;

      const req = toWebRequest(ctx);
      const text = await req.text();
      expect(text).toBe('{"username":"john"}');
    });
  });
});
