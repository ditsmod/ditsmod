import { jest } from '@jest/globals';

const mockSpan = {
  setStatus: jest.fn(),
};

jest.unstable_mockModule('@sentry/node', () => {
  return {
    withIsolationScope: jest.fn((callback: any) => callback()),
    startSpan: jest.fn((options: any, callback: any) => callback(mockSpan)),
  };
});

import type { HttpHandler, BaseRequestContext } from '@ditsmod/rest';

// Import dynamically after mock
const Sentry = (await import('@sentry/node')) as any;
const { SentrySpanInterceptor } = await import('./sentry-span.interceptor.js');

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

    expect(Sentry.withIsolationScope).toHaveBeenCalled();
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

    expect(Sentry.withIsolationScope).toHaveBeenCalled();
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

  it('should set span status to error if handle throws', async () => {
    const err = new Error('database failure');
    next.handle = jest.fn(() => Promise.reject(err));

    interceptor = new SentrySpanInterceptor(undefined);
    await expect(interceptor.intercept(next, ctx)).rejects.toThrow(err);

    expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: 2, message: 'database failure' });
  });
});
