import { jest } from '@jest/globals';
import type { Logger } from '@ditsmod/core';
import type { DataSource } from 'typeorm';

import { initializeWithRetry } from './retry.js';

describe('retry', () => {
  let loggerMock: jest.Mocked<Logger>;

  beforeEach(() => {
    loggerMock = {
      log: jest.fn(),
    } as any;
  });

  it('should initialize DataSource immediately on first try', async () => {
    const dsMock = {
      initialize: jest.fn<any>(),
    } as any;
    dsMock.initialize.mockResolvedValue(dsMock);

    const result = await initializeWithRetry(dsMock, { retryAttempts: 3, retryDelay: 10 }, loggerMock, 'default');

    expect(result).toBe(dsMock);
    expect(dsMock.initialize).toHaveBeenCalledTimes(1);
    expect(loggerMock.log).not.toHaveBeenCalled();
  });

  it('should retry initialization on failure and succeed', async () => {
    const dsMock = {
      initialize: jest.fn<any>(),
    } as any;

    dsMock.initialize
      .mockRejectedValueOnce(new Error('Connection refused'))
      .mockRejectedValueOnce(new Error('Connection refused'))
      .mockResolvedValue(dsMock);

    const result = await initializeWithRetry(dsMock, { retryAttempts: 3, retryDelay: 1 }, loggerMock, 'analytics');

    expect(result).toBe(dsMock);
    expect(dsMock.initialize).toHaveBeenCalledTimes(3);
    expect(loggerMock.log).toHaveBeenCalledTimes(2);
    expect(loggerMock.log).toHaveBeenNthCalledWith(
      1,
      'error',
      'Unable to connect to the database (analytics). Retrying (1)...',
    );
  });

  it('should throw error if retryAttempts limit is reached', async () => {
    const error = new Error('Database down');
    const dsMock = {
      initialize: jest.fn<any>().mockRejectedValue(error),
    } as any;

    await expect(
      initializeWithRetry(dsMock, { retryAttempts: 2, retryDelay: 1 }, loggerMock, 'default'),
    ).rejects.toThrow('Database down');

    expect(dsMock.initialize).toHaveBeenCalledTimes(3);
    expect(loggerMock.log).toHaveBeenCalledTimes(2);
  });

  it('should stop retrying immediately if toRetry returns false', async () => {
    const error = new Error('Fatal auth error');
    const dsMock = {
      initialize: jest.fn<any>().mockRejectedValue(error),
    } as any;

    const toRetry = jest.fn<(err: any) => boolean>().mockReturnValue(false);

    await expect(
      initializeWithRetry(dsMock, { retryAttempts: 5, retryDelay: 1, toRetry }, loggerMock, 'default'),
    ).rejects.toThrow('Fatal auth error');

    expect(dsMock.initialize).toHaveBeenCalledTimes(1);
    expect(toRetry).toHaveBeenCalledWith(error);
    expect(loggerMock.log).not.toHaveBeenCalled();
  });

  it('should include error message when verboseRetryLog is true', async () => {
    const error = new Error('Socket timeout');
    const dsMock = {
      initialize: jest.fn<any>(),
    } as any;
    dsMock.initialize.mockRejectedValueOnce(error).mockResolvedValue(dsMock);

    await initializeWithRetry(
      dsMock,
      { retryAttempts: 1, retryDelay: 1, verboseRetryLog: true },
      loggerMock,
      'default',
    );

    expect(loggerMock.log).toHaveBeenCalledWith(
      'error',
      'Unable to connect to the database. Message: Socket timeout. Retrying (1)...',
    );
  });
});
