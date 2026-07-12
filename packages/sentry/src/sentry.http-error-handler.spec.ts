import { jest } from '@jest/globals';

import { Logger, Injector, HttpStatus } from '@ditsmod/core';
import { CustomError } from '@ditsmod/core/errors';
import type { RawResponse } from '@ditsmod/rest';

import type { SentryHttpErrorHandler } from './sentry.http-error-handler.js';

// Mock Sentry
const mockScope = {
  setTag: jest.fn(),
  setExtra: jest.fn(),
};

jest.unstable_mockModule('@sentry/node', () => {
  return {
    getCurrentScope: jest.fn(() => mockScope),
    captureException: jest.fn(),
  };
});

// Dynamically import code under test and other modules using the mock
const { SentryHttpErrorHandler: ErrorHandler } = await import('./sentry.http-error-handler.js');
const Sentry = (await import('@sentry/node')) as any;
const { RequestContext } = await import('@ditsmod/rest');
const { SentryOptions } = await import('./types.js');

describe('SentryHttpErrorHandler', () => {
  let errorHandler: SentryHttpErrorHandler;

  const rawRes = {
    headersSent: false,
    getHeader(...args: any[]) {},
    hasHeader(...args: any[]) {},
    setHeader(...args: any[]) {},
    writeHead(...args: any[]) {},
    end(...args: any[]) {},
  } as RawResponse;

  const ctx = new RequestContext();
  ctx.setCtx({} as any, rawRes, [{ key: 'id', value: '123' }], '');
  const logger = { log(...args: any[]) {} } as Logger;

  beforeEach(() => {
    jest.clearAllMocks();
    const injector = Injector.resolveAndCreate([{ token: Logger, useValue: logger }, ErrorHandler]);
    errorHandler = injector.get(ErrorHandler);
    jest.spyOn(rawRes, 'end');
    jest.spyOn(logger, 'log');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should capture unexpected error and send to Sentry', async () => {
    const err = new Error('unexpected database error');
    await errorHandler.handleError(err, ctx);

    expect(Sentry.getCurrentScope).toHaveBeenCalled();
    expect(mockScope.setTag).toHaveBeenCalledWith('http.method', 'UNKNOWN');
    expect(Sentry.captureException).toHaveBeenCalledWith(err, {
      mechanism: {
        handled: false,
        type: 'auto.http.ditsmod.error_handler',
      },
    });
    expect(rawRes.end).toHaveBeenCalled();
  });

  it('should NOT capture expected custom error (status 400, level warn)', async () => {
    const err = new CustomError({
      msg1: 'bad request',
      status: HttpStatus.BAD_REQUEST,
      level: 'warn',
    });
    await errorHandler.handleError(err, ctx);

    expect(Sentry.captureException).not.toHaveBeenCalled();
    expect(rawRes.end).toHaveBeenCalled();
  });

  it('should capture expected custom error (status 400, level warn) if capture4xx is true', async () => {
    const injector = Injector.resolveAndCreate([
      { token: Logger, useValue: logger },
      { token: SentryOptions, useValue: { capture4xx: true } },
      ErrorHandler,
    ]);
    errorHandler = injector.get(ErrorHandler);

    const err = new CustomError({
      msg1: 'bad request',
      status: HttpStatus.BAD_REQUEST,
      level: 'warn',
    });
    await errorHandler.handleError(err, ctx);

    expect(Sentry.captureException).toHaveBeenCalledWith(err, expect.any(Object));
    expect(rawRes.end).toHaveBeenCalled();
  });

  it('should capture custom error with status >= 500', async () => {
    const err = new CustomError({
      msg1: 'internal custom error',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      level: 'error',
    });
    await errorHandler.handleError(err, ctx);

    expect(Sentry.captureException).toHaveBeenCalledWith(err, expect.any(Object));
  });
});
