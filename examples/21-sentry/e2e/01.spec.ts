import { jest } from '@jest/globals';

const mockScope = {
  setTag: jest.fn(),
  setExtra: jest.fn(),
};

jest.unstable_mockModule('@sentry/node', () => {
  return {
    init: jest.fn(),
    captureException: jest.fn(),
    withIsolationScope: jest.fn((callback: any) => callback(mockScope)),
    startSpan: jest.fn((options: any, callback: any) => callback()),
    withMonitor: jest.fn((slug: string, callback: any, config?: any) => callback()),
  };
});

jest.unstable_mockModule('@sentry/core', async () => {
  const actual = await jest.requireActual<any>('@sentry/core');
  return {
    ...actual,
    getIsolationScope: jest.fn(() => ({
      setTransactionName: jest.fn(),
      setTag: jest.fn(),
      setExtra: jest.fn(),
    })),
    getDefaultIsolationScope: jest.fn(() => ({})), // different object to simulate active Sentry
  };
});

import request from 'supertest';
import type { HttpServer } from '@ditsmod/rest';

// Import dynamically to apply Sentry mocks
const Sentry = await import('@sentry/node');
const { TestRestApplication } = await import('@ditsmod/rest-testing');
const { AppModule } = await import('#app/app.module.js');

describe('21-sentry e2e', () => {
  let server: HttpServer;
  let testAgent: ReturnType<typeof request>;

  beforeAll(async () => {
    server = await TestRestApplication.createTestApp(AppModule).getServer();
    testAgent = request(server);
  });

  afterAll(() => {
    server?.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /hello should return 200 and trigger sentryTraced', async () => {
    const { status, text } = await testAgent.get('/hello');
    expect(status).toBe(200);
    expect(text).toBe('Hello from Sentry-traced endpoint!');
    expect(Sentry.startSpan).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'sayHello',
        op: 'hello-operation',
      }),
      expect.any(Function),
    );
  });

  it('GET /error should return 500 and capture unexpected error', async () => {
    const { status } = await testAgent.get('/error');
    expect(status).toBe(500);
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        mechanism: expect.objectContaining({
          type: 'auto.http.ditsmod.error_handler',
        }),
      }),
    );
  });

  it('GET /expected-error should return 400 and NOT capture the error', async () => {
    const { status } = await testAgent.get('/expected-error');
    expect(status).toBe(400);
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('GET /cron should return 200 and trigger sentryCron monitor', async () => {
    const { status, text } = await testAgent.get('/cron');
    expect(status).toBe(200);
    expect(text).toBe('Cron job check-in sent to Sentry!');
    expect(Sentry.withMonitor).toHaveBeenCalledWith('my-sentry-cron', expect.any(Function), expect.any(Object));
  });

  it('GET /capture-exception should return 200 and capture manually decorated exception', async () => {
    const { status, text } = await testAgent.get('/capture-exception');
    expect(status).toBe(200);
    expect(text).toBe('Exception captured manually!');
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        mechanism: expect.objectContaining({
          type: 'auto.function.ditsmod.exception_captured',
        }),
      }),
    );
  });
});
