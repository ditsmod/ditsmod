import { jest } from '@jest/globals';

jest.unstable_mockModule('@sentry/node', () => {
  return {
    startSpan: jest.fn((options: any, callback: any) => callback()),
  };
});

import type { HttpHandler, BaseRequestContext } from '@ditsmod/rest';

// Import dynamically after mock
const { SentrySpanInterceptor } = await import('./sentry-span.interceptor.js');
const Sentry = await import('@sentry/node');

describe('SentrySpanInterceptor', () => {
  let interceptor: any;
  let next: HttpHandler;
  let ctx: BaseRequestContext;

  beforeEach(() => {
    jest.clearAllMocks();

    next = {
      handle: jest.fn(() => Promise.resolve('ok')),
    };

    ctx = {
      rawReq: {
        method: 'GET',
        url: '/users',
      },
    } as any;
  });

  it('should start Sentry span with path from RouteMeta', async () => {
    const routeMeta = {
      fullPath: 'users/:id',
    } as any;

    interceptor = new SentrySpanInterceptor(routeMeta);
    await interceptor.intercept(next, ctx);

    expect(Sentry.startSpan).toHaveBeenCalledWith(
      {
        name: 'GET /users/:id',
        op: 'http.server',
        attributes: {
          'http.method': 'GET',
          'http.route': '/users/:id',
        },
      },
      expect.any(Function),
    );
    expect(next.handle).toHaveBeenCalled();
  });

  it('should fallback to ctx.rawReq.url if RouteMeta is missing', async () => {
    interceptor = new SentrySpanInterceptor(undefined);
    await interceptor.intercept(next, ctx);

    expect(Sentry.startSpan).toHaveBeenCalledWith(
      {
        name: 'GET /users',
        op: 'http.server',
        attributes: {
          'http.method': 'GET',
          'http.route': '/users',
        },
      },
      expect.any(Function),
    );
  });
});
