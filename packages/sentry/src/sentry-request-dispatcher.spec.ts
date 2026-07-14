import { jest } from '@jest/globals';
import { Logger, Injector } from '@ditsmod/core';

// Mock Sentry
const mockSpan = {
  setStatus: jest.fn(),
};

jest.unstable_mockModule('@sentry/node', () => {
  return {
    withIsolationScope: jest.fn((callback: any) => callback()),
    continueTrace: jest.fn((options: any, callback: any) => callback()),
    startSpan: jest.fn((options: any, callback: any) => callback(mockSpan)),
    captureException: jest.fn(),
  };
});

// Dynamically import code under test
const { SentryRequestDispatcher } = await import('./sentry-request-dispatcher.js');
const Sentry = (await import('@sentry/node')) as any;
const { Router } = await import('@ditsmod/rest');
const { SystemLogMediator } = await import('@ditsmod/core');

describe('SentryRequestDispatcher', () => {
  let dispatcher: any;
  let mockRouter: any;
  let mockSystemLogMediator: any;
  let mockLogger: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRouter = {
      find: jest.fn(() => ({ handle: jest.fn(() => Promise.resolve()), params: [] })),
    };

    mockLogger = {
      log: jest.fn(),
    };

    mockSystemLogMediator = {
      internalServerError: jest.fn(),
    };

    const injector = Injector.resolveAndCreate([
      { token: Router, useValue: mockRouter },
      { token: Logger, useValue: mockLogger },
      { token: SystemLogMediator, useValue: mockSystemLogMediator },
      SentryRequestDispatcher,
    ]);

    dispatcher = injector.get(SentryRequestDispatcher);
  });

  it('should wrap requestListener with isolation scope, continueTrace and startSpan', async () => {
    const rawReq = {
      method: 'GET',
      url: '/users/123?foo=bar',
      headers: {
        'sentry-trace': 'trace-id',
        baggage: 'baggage-data',
      },
    };
    const rawRes = {
      statusCode: 200,
      end: jest.fn(),
    };

    await dispatcher.requestListener(rawReq, rawRes);

    expect(Sentry.withIsolationScope).toHaveBeenCalled();
    expect(Sentry.continueTrace).toHaveBeenCalledWith(
      {
        sentryTrace: 'trace-id',
        baggage: 'baggage-data',
      },
      expect.any(Function),
    );
    expect(Sentry.startSpan).toHaveBeenCalledWith(
      {
        name: 'GET /users/123',
        op: 'http.server',
      },
      expect.any(Function),
    );
    expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: 1 });
  });

  it('should capture exception and throw when handler throws error', async () => {
    const rawReq = {
      method: 'GET',
      url: '/users/123',
      headers: {},
    };
    const rawRes = {
      statusCode: 500,
      end: jest.fn(),
    };

    const error = new Error('Database connection failed');
    mockRouter.find.mockReturnValue({
      handle: jest.fn(() => Promise.reject(error)),
      params: [],
    });

    await dispatcher.requestListener(rawReq, rawRes);

    expect(Sentry.captureException).toHaveBeenCalledWith(error);
    expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: 2, message: 'HTTP 500' });
    expect(rawRes.end).toHaveBeenCalled();
  });
});
