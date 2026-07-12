import { jest } from '@jest/globals';

// Mock Sentry core isolation scope functions preserving other exports
const mockScope = {
  setTransactionName: jest.fn(),
};

jest.unstable_mockModule('@sentry/core', async () => {
  const actual = await jest.requireActual<any>('@sentry/core');
  return {
    ...actual,
    getIsolationScope: jest.fn(() => mockScope),
    getDefaultIsolationScope: jest.fn(() => ({})), // different object
  };
});

import type { HttpHandler, BaseRequestContext } from '@ditsmod/rest';

// Import dynamically after mock is set up
const { SentryTracingInterceptor } = await import('./sentry-tracing.interceptor.js');

describe('SentryTracingInterceptor', () => {
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
        method: 'POST',
        url: '/api/v1/users',
      },
    } as any;
  });

  it('should set transaction name based on RouteMeta.fullPath if available', async () => {
    const routeMeta = {
      fullPath: 'api/v1/users/:id',
    } as any;

    interceptor = new SentryTracingInterceptor(routeMeta);
    await interceptor.intercept(next, ctx);

    expect(mockScope.setTransactionName).toHaveBeenCalledWith('POST /api/v1/users/:id');
    expect(next.handle).toHaveBeenCalled();
  });

  it('should fallback to ctx.rawReq.url if RouteMeta is missing or does not have fullPath', async () => {
    interceptor = new SentryTracingInterceptor(undefined as any);
    await interceptor.intercept(next, ctx);

    expect(mockScope.setTransactionName).toHaveBeenCalledWith('POST /api/v1/users');
    expect(next.handle).toHaveBeenCalled();
  });
});
