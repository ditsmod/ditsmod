import type { DataSource } from 'typeorm';

import type { TypeormLogMediator } from './typeorm.log-mediator.js';

export interface TypeormRetryOptions {
  retryAttempts?: number;
  retryDelay?: number;
  toRetry?: (err: any) => boolean;
  verboseRetryLog?: boolean;
}

/**
 * Attempts to initialize a `DataSource` with configurable retry and backoff.
 *
 * - Makes `retryAttempts + 1` total attempts (one initial attempt plus up to
 *   `retryAttempts` retries). Pass `retryAttempts: 0` to make exactly one
 *   attempt with no retries.
 * - If `toRetry` is provided and returns `false` for an error, that error is
 *   rethrown immediately without further retries.
 * - On exhausting all attempts, the last captured error is rethrown.
 */
export async function initializeWithRetry(
  dataSource: DataSource,
  options: TypeormRetryOptions,
  log: TypeormLogMediator,
  sender: object,
  dataSourceName: string,
): Promise<DataSource> {
  const { retryAttempts = 9, retryDelay = 3000, toRetry, verboseRetryLog } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retryAttempts; attempt++) {
    try {
      return await dataSource.initialize();
    } catch (err: unknown) {
      if (toRetry && !toRetry(err)) {
        throw err;
      }
      lastError = err;
      if (attempt < retryAttempts) {
        const verboseMessage = verboseRetryLog ? ` Message: ${(err as Error).message}.` : '';
        log.unableToConnectToDatabase(sender, dataSourceName, attempt + 1, verboseMessage);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  throw lastError;
}
