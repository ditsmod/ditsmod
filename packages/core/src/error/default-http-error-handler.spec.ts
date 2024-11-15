import { jest } from '@jest/globals';

import { Injector } from '#di';
import { RequestContext } from '#services/request-context.js';
import { Logger } from '#logger/logger.js';
import { HttpResponse } from '#types/server-options.js';
import { Status } from '#utils/http-status-codes.js';
import { CustomError } from '#error/custom-error.js';
import { DefaultHttpErrorHandler as ErrorHandler } from '#error/default-http-error-handler.js';

describe('DefaultHttpErrorHandler', () => {
  let errorHandler: ErrorHandler;

  const httpRes = {
    headersSent: false,
    getHeader(...args: any[]) {},
    hasHeader(...args: any[]) {},
    setHeader(...args: any[]) {},
    writeHead(...args: any[]) {},
    end(...args: any[]) {},
  } as HttpResponse;

  const ctx = new RequestContext({} as any, httpRes, null, '');
  const logger = { log(...args: any[]) {} } as Logger;

  beforeEach(() => {
    const injector = Injector.resolveAndCreate([{ token: Logger, useValue: logger }, ErrorHandler]);
    errorHandler = injector.get(ErrorHandler);
    jest.spyOn(httpRes, 'end');
    jest.spyOn(logger, 'log');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('default error with some message', () => {
    const err = new Error('one');
    (err as any).status = Status.PAYLOAD_TO_LARGE;
    expect(() => errorHandler.handleError(err, ctx)).not.toThrow();
    expect(httpRes.statusCode).toBe(Status.PAYLOAD_TO_LARGE);
    expect(httpRes.end).toHaveBeenCalledWith(JSON.stringify({ error: 'one' }));
    expect(httpRes.end).toHaveBeenCalledTimes(1);
    expect(logger.log).toHaveBeenCalledWith('error', { err, requestId: expect.any(String) });
    expect(logger.log).toHaveBeenCalledTimes(1);
  });

  it('custom error with msg1', () => {
    const msg1 = 'one';
    const err = new CustomError({ msg1 });
    expect(() => errorHandler.handleError(err, ctx)).not.toThrow();
    expect(httpRes.statusCode).toBe(Status.BAD_REQUEST);
    expect(httpRes.end).toHaveBeenCalledWith(JSON.stringify({ error: 'one' }));
    expect(httpRes.end).toHaveBeenCalledTimes(1);
    expect(logger.log).toHaveBeenCalledWith('warn', { err, requestId: expect.any(String) });
    expect(logger.log).toHaveBeenCalledTimes(1);
  });

  it('custom error with status and level changed', () => {
    const msg1 = 'one';
    const err = new CustomError({ msg1, status: Status.CONFLICT, level: 'fatal' });
    expect(() => errorHandler.handleError(err, ctx)).not.toThrow();
    expect(httpRes.statusCode).toBe(Status.CONFLICT);
    expect(httpRes.end).toHaveBeenCalledWith(JSON.stringify({ error: 'one' }));
    expect(httpRes.end).toHaveBeenCalledTimes(1);
    expect(logger.log).toHaveBeenCalledWith('fatal', { err, requestId: expect.any(String) });
    expect(logger.log).toHaveBeenCalledTimes(1);
  });

  it('custom error with msg1 and arguments for format', () => {
    const msg1 = 'one two';
    const err = new CustomError({ msg1 });
    expect(() => errorHandler.handleError(err, ctx)).not.toThrow();
    expect(httpRes.statusCode).toBe(Status.BAD_REQUEST);
    expect(httpRes.end).toHaveBeenCalledWith(JSON.stringify({ error: 'one two' }));
    expect(httpRes.end).toHaveBeenCalledTimes(1);
    expect(logger.log).toHaveBeenCalledWith('warn', { err, requestId: expect.any(String) });
    expect(logger.log).toHaveBeenCalledTimes(1);
  });

  it('custom error with msg2', () => {
    const msg2 = 'one';
    const err = new CustomError({ msg2 });
    expect(() => errorHandler.handleError(err, ctx)).not.toThrow();
    expect(httpRes.statusCode).toBe(Status.BAD_REQUEST);
    expect(httpRes.end).toHaveBeenCalledWith(JSON.stringify({ error: 'Internal server error' }));
    expect(httpRes.end).toHaveBeenCalledTimes(1);
    expect(logger.log).toHaveBeenCalledWith('warn', { err, requestId: expect.any(String) });
    expect(logger.log).toHaveBeenCalledTimes(1);
  });

  it('custom error with msg2 and arguments for format', () => {
    const msg2 = 'one %s three';
    const err = new CustomError({ msg2 });
    expect(() => errorHandler.handleError(err, ctx)).not.toThrow();
    expect(httpRes.statusCode).toBe(Status.BAD_REQUEST);
    expect(httpRes.end).toHaveBeenCalledWith(JSON.stringify({ error: 'Internal server error' }));
    expect(logger.log).toHaveBeenCalledWith('warn', { err, requestId: expect.any(String) });
    expect(logger.log).toHaveBeenCalledTimes(1);
  });

  it('custom error with msg1, msg2 and arguments for format', () => {
    const msg1 = 'one two';
    const msg2 = 'four six';
    const err = new CustomError({ msg1, msg2 });
    expect(() => errorHandler.handleError(err, ctx)).not.toThrow();
    expect(httpRes.statusCode).toBe(Status.BAD_REQUEST);
    expect(httpRes.end).toHaveBeenCalledWith(JSON.stringify({ error: 'one two' }));
    expect(httpRes.end).toHaveBeenCalledTimes(1);
    expect(logger.log).toHaveBeenCalledWith('warn', { err, requestId: expect.any(String) });
    expect(logger.log).toHaveBeenCalledTimes(1);
  });
});
