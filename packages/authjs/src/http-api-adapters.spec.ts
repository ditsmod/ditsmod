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

    it('uses process.env.HOST and alternativeUrl when provided', () => {
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
