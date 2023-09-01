import { jest } from '@jest/globals';

import { NODE_RES } from '#constans';
import { Injector } from '#di';
import { Logger } from '#types/logger.js';
import { NodeResponse } from '#types/server-options.js';
import { Status } from '#utils/http-status-codes.js';
import { CustomError } from '../custom-error/custom-error.js';
import { ErrorOpts } from '../custom-error/error-opts.js';
import { DefaultHttpErrorHandler as ErrorHandler } from './default-http-error-handler.js';
import { Req } from './request.js';
import { Res } from './response.js';

describe('ErrorHandler', () => {
  type ErrorLog = ErrorOpts & { err?: any };
  let errorHandler: ErrorHandler;

  const req = {
    requestId: '',
    toString() {
      return '';
    },
  } as Req;

  const nodeRes = {
    headersSent: false,
    hasHeader(...args: any[]) {},
    setHeader(...args: any[]) {},
  } as NodeResponse;

  const res = {
    nodeRes: {
      headersSent: false,
      hasHeader(...args: any[]) {},
      setHeader(...args: any[]) {},
    },
    sendJson(...args: any[]) {},
  } as unknown as Res;

  const logger = {
    log(...args: any[]) {},
    error(...args: any[]) {},
  } as Logger;

  beforeEach(() => {
    const injector = Injector.resolveAndCreate([
      { token: Req, useValue: req },
      { token: Res, useValue: res },
      { token: Logger, useValue: logger },
      { token: NODE_RES, useValue: nodeRes },
      ErrorHandler,
    ]);

    errorHandler = injector.get(ErrorHandler);

    jest.spyOn(res, 'sendJson');
    jest.spyOn(logger, 'log');
    jest.spyOn(logger, 'error');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('default error with some message', () => {
    const err = new Error('one');
    expect(() => errorHandler.handleError(err)).not.toThrow();
    expect(res.sendJson).toBeCalledWith({ error: 'Internal server error' }, Status.INTERNAL_SERVER_ERROR);
    expect(res.sendJson).toBeCalledTimes(1);
    expect(logger.error).toBeCalledWith(err);
    expect(logger.error).toBeCalledTimes(1);
    expect(logger.log).toBeCalledTimes(0);
  });

  it('custom error with msg1', () => {
    const msg1 = 'one';
    const err = new CustomError({ msg1 });
    expect(() => errorHandler.handleError(err)).not.toThrow();
    expect(res.sendJson).toBeCalledWith({ error: 'one' }, Status.BAD_REQUEST);
    expect(res.sendJson).toBeCalledTimes(1);
    expect(logger.log).toBeCalledWith('debug', err);
    expect(logger.log).toBeCalledTimes(1);
    expect(logger.error).toBeCalledTimes(0);
  });

  it('custom error with status and level changed', () => {
    const msg1 = 'one';
    const err = new CustomError({ msg1, status: Status.CONFLICT, level: 'fatal' });
    expect(() => errorHandler.handleError(err)).not.toThrow();
    expect(res.sendJson).toBeCalledWith({ error: 'one' }, Status.CONFLICT);
    expect(res.sendJson).toBeCalledTimes(1);
    expect(logger.log).toBeCalledWith('fatal', err);
    expect(logger.log).toBeCalledTimes(1);
    expect(logger.error).toBeCalledTimes(0);
  });

  it('custom error with msg1 and arguments for format', () => {
    const msg1 = 'one two';
    const err = new CustomError({ msg1 });
    expect(() => errorHandler.handleError(err)).not.toThrow();
    expect(res.sendJson).toBeCalledWith({ error: 'one two' }, Status.BAD_REQUEST);
    expect(res.sendJson).toBeCalledTimes(1);
    expect(logger.log).toBeCalledWith('debug', err);
    expect(logger.log).toBeCalledTimes(1);
    expect(logger.error).toBeCalledTimes(0);
  });

  it('custom error with msg2', () => {
    const msg2 = 'one';
    const err = new CustomError({ msg2 });
    expect(() => errorHandler.handleError(err)).not.toThrow();
    expect(res.sendJson).toBeCalledWith({ error: 'Internal server error' }, Status.BAD_REQUEST);
    expect(res.sendJson).toBeCalledTimes(1);
    expect(logger.log).toBeCalledWith('debug', err);
    expect(logger.log).toBeCalledTimes(1);
    expect(logger.error).toBeCalledTimes(0);
  });

  it('custom error with msg2 and arguments for format', () => {
    const msg2 = 'one %s three';
    const err = new CustomError({ msg2 });
    expect(() => errorHandler.handleError(err)).not.toThrow();
    expect(res.sendJson).toBeCalledWith({ error: 'Internal server error' }, Status.BAD_REQUEST);
    expect(logger.log).toBeCalledWith('debug', err);
    expect(logger.log).toBeCalledTimes(1);
    expect(logger.error).toBeCalledTimes(0);
  });

  it('custom error with msg1, msg2 and arguments for format', () => {
    const msg1 = 'one two';
    const msg2 = 'four six';
    const err = new CustomError({ msg1, msg2 });
    expect(() => errorHandler.handleError(err)).not.toThrow();
    expect(res.sendJson).toBeCalledWith({ error: 'one two' }, Status.BAD_REQUEST);
    expect(res.sendJson).toBeCalledTimes(1);
    expect(logger.log).toBeCalledWith('debug', err);
    expect(logger.log).toBeCalledTimes(1);
    expect(logger.error).toBeCalledTimes(0);
  });
});
