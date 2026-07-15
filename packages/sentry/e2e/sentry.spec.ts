import { jest } from '@jest/globals';
import request from 'supertest';
import { route, RestModule, controller, RequestDispatcher, HttpErrorHandler, restRootModule } from '@ditsmod/rest';
import { TestRestApplication, TestRestPlugin } from '@ditsmod/rest-testing';

// 1. Mock Sentry before imports
const mockSpan = {
  setStatus: jest.fn(),
};

const mockScope = {
  setTag: jest.fn(),
  setExtra: jest.fn(),
  setTransactionName: jest.fn(),
};

const mockClient = {
  getDsn: () => 'https://mock-public-key@mock-sentry-host/mock-project-id',
};

jest.unstable_mockModule('@sentry/node', async () => {
  const actual = await jest.requireActual<any>('@sentry/node');
  return {
    ...actual,
    init: jest.fn(),
    getClient: () => mockClient,
    getCurrentScope: jest.fn(() => mockScope),
    getIsolationScope: jest.fn(() => mockScope),
    withIsolationScope: jest.fn((callback: any) => callback()),
    continueTrace: jest.fn((options: any, callback: any) => callback()),
    startSpan: jest.fn((options: any, callback: any) => callback(mockSpan)),
    captureException: jest.fn(),
  };
});

jest.unstable_mockModule('@sentry/core', async () => {
  const actual = await jest.requireActual<any>('@sentry/core');
  return {
    ...actual,
    getClient: jest.fn(() => mockClient),
    getIsolationScope: jest.fn(() => mockScope),
  };
});

// 2. Import modules after Sentry mock
const Sentry = (await import('@sentry/node')) as any;
const { SentryModule } = await import('#src/index.js');

@controller()
class HelloController {
  @route('GET', 'hello')
  tellHello() {
    return 'hello';
  }

  @route('GET', 'throw-error')
  throwErr() {
    throw new Error('test-error');
  }
}

@restRootModule({
  imports: [RestModule, SentryModule],
  controllers: [HelloController],
  resolvedCollisionPerApp: [[RequestDispatcher, SentryModule]],
  resolvedCollisionPerRou: [[HttpErrorHandler, SentryModule]],
})
class AppModule {}

describe('Sentry E2E Tests', () => {
  let server: any;

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    if (server) {
      server.close();
    }
  });

  it('should process standard request, trace it, and update transaction name', async () => {
    server = await TestRestApplication.createTestApp(AppModule).$use(TestRestPlugin).getServer();

    const response = await request(server)
      .get('/hello')
      .set('sentry-trace', 'trace-id-123')
      .set('baggage', 'baggage-data-123');

    expect(response.status).toBe(200);
    expect(response.text).toBe('hello');

    // Verify Sentry request listener wrapping occurred
    expect(Sentry.withIsolationScope).toHaveBeenCalled();
    expect(Sentry.continueTrace).toHaveBeenCalledWith(
      {
        sentryTrace: 'trace-id-123',
        baggage: 'baggage-data-123',
      },
      expect.any(Function),
    );
    expect(Sentry.startSpan).toHaveBeenCalledWith(
      {
        name: 'GET /hello',
        op: 'http.server',
      },
      expect.any(Function),
    );

    // Verify SentryTracingInterceptor updated the transaction name to parametrized name
    expect(mockScope.setTransactionName).toHaveBeenCalledWith('GET /hello');
    expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: 1 });
  });

  it('should capture unhandled exceptions and set span status to error', async () => {
    server = await TestRestApplication.createTestApp(AppModule).$use(TestRestPlugin).getServer();

    const response = await request(server).get('/throw-error');

    expect(response.status).toBe(500);

    // Verify that exception is captured and span is marked as error
    expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error), expect.any(Object));
    expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: 2, message: 'HTTP 500' });
  });
});
