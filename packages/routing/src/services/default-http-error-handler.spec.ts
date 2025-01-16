import { Logger, Injector, Status, CustomError } from '@ditsmod/core';
import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';

import { RequestContext } from './services/request-context.js';
import { RawResponse } from './services/request.js';
import { DefaultHttpErrorHandler as ErrorHandler } from './services/default-http-error-handler.js';


describe('DefaultHttpErrorHandler', () => {
  let errorHandler: ErrorHandler;

  const rawRes = {
    headersSent: false,
    getHeader(...args: any[]) {},
    hasHeader(...args: any[]) {},
    setHeader(...args: any[]) {},
    writeHead(...args: any[]) {},
    end(...args: any[]) {},
  } as RawResponse;

  const ctx = new RequestContext({} as any, rawRes, null, '');
  const logger = { log(...args: any[]) {} } as Logger;

  beforeEach(() => {
    const injector = Injector.resolveAndCreate([{ token: Logger, useValue: logger }, ErrorHandler]);
    errorHandler = injector.get(ErrorHandler);
    vi.spyOn(rawRes, 'end');
    vi.spyOn(logger, 'log');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('default error with some message', () => {
    const err = new Error('one');
    (err as any).status = Status.PAYLOAD_TO_LARGE;
    expect(() => errorHandler.handleError(err, ctx)).not.toThrow();
    expect(rawRes.statusCode).toBe(Status.PAYLOAD_TO_LARGE);
    expect(rawRes.end).toHaveBeenCalledWith(JSON.stringify({ error: 'one' }));
    expect(rawRes.end).toHaveBeenCalledTimes(1);
    expect(logger.log).toHaveBeenCalledWith('error', { err, requestId: expect.any(String) });
    expect(logger.log).toHaveBeenCalledTimes(1);
  });

  it('custom error with msg1', () => {
    const msg1 = 'one';
    const err = new CustomError({ msg1 });
    expect(() => errorHandler.handleError(err, ctx)).not.toThrow();
    expect(rawRes.statusCode).toBe(Status.BAD_REQUEST);
    expect(rawRes.end).toHaveBeenCalledWith(JSON.stringify({ error: 'one' }));
    expect(rawRes.end).toHaveBeenCalledTimes(1);
    expect(logger.log).toHaveBeenCalledWith('warn', { err, requestId: expect.any(String) });
    expect(logger.log).toHaveBeenCalledTimes(1);
  });

  it('custom error with status and level changed', () => {
    const msg1 = 'one';
    const err = new CustomError({ msg1, status: Status.CONFLICT, level: 'fatal' });
    expect(() => errorHandler.handleError(err, ctx)).not.toThrow();
    expect(rawRes.statusCode).toBe(Status.CONFLICT);
    expect(rawRes.end).toHaveBeenCalledWith(JSON.stringify({ error: 'one' }));
    expect(rawRes.end).toHaveBeenCalledTimes(1);
    expect(logger.log).toHaveBeenCalledWith('fatal', { err, requestId: expect.any(String) });
    expect(logger.log).toHaveBeenCalledTimes(1);
  });

  it('custom error with msg1 and arguments for format', () => {
    const msg1 = 'one two';
    const err = new CustomError({ msg1 });
    expect(() => errorHandler.handleError(err, ctx)).not.toThrow();
    expect(rawRes.statusCode).toBe(Status.BAD_REQUEST);
    expect(rawRes.end).toHaveBeenCalledWith(JSON.stringify({ error: 'one two' }));
    expect(rawRes.end).toHaveBeenCalledTimes(1);
    expect(logger.log).toHaveBeenCalledWith('warn', { err, requestId: expect.any(String) });
    expect(logger.log).toHaveBeenCalledTimes(1);
  });

  it('custom error with msg2', () => {
    const msg2 = 'one';
    const err = new CustomError({ msg2 });
    expect(() => errorHandler.handleError(err, ctx)).not.toThrow();
    expect(rawRes.statusCode).toBe(Status.BAD_REQUEST);
    expect(rawRes.end).toHaveBeenCalledWith(JSON.stringify({ error: 'Internal server error' }));
    expect(rawRes.end).toHaveBeenCalledTimes(1);
    expect(logger.log).toHaveBeenCalledWith('warn', expect.stringContaining('Error: one'));
    expect(logger.log).toHaveBeenCalledWith('warn', expect.stringContaining('requestId:'));
    expect(logger.log).toHaveBeenCalledTimes(1);
  });

  it('custom error with msg2 and arguments for format', () => {
    const msg2 = 'one %s three';
    const err = new CustomError({ msg2 });
    expect(() => errorHandler.handleError(err, ctx)).not.toThrow();
    expect(rawRes.statusCode).toBe(Status.BAD_REQUEST);
    expect(rawRes.end).toHaveBeenCalledWith(JSON.stringify({ error: 'Internal server error' }));
    expect(logger.log).toHaveBeenCalledWith('warn', expect.stringContaining('Error: one %s three'));
    expect(logger.log).toHaveBeenCalledWith('warn', expect.stringContaining('requestId:'));
    expect(logger.log).toHaveBeenCalledTimes(1);
  });

  it('custom error with msg1, msg2 and arguments for format', () => {
    const msg1 = 'one two';
    const msg2 = 'four six';
    const err = new CustomError({ msg1, msg2 });
    expect(() => errorHandler.handleError(err, ctx)).not.toThrow();
    expect(rawRes.statusCode).toBe(Status.BAD_REQUEST);
    expect(rawRes.end).toHaveBeenCalledWith(JSON.stringify({ error: 'one two' }));
    expect(rawRes.end).toHaveBeenCalledTimes(1);
    expect(logger.log).toHaveBeenCalledWith('warn', expect.stringContaining('Error: four six'));
    expect(logger.log).toHaveBeenCalledWith('warn', expect.stringContaining('requestId:'));
    expect(logger.log).toHaveBeenCalledTimes(1);
  });
});
