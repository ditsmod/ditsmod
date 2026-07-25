import type { Logger } from '@ditsmod/core';
import type { DataSource } from 'typeorm';

export interface TypeormRetryOptions {
  retryAttempts?: number;
  retryDelay?: number;
  toRetry?: (err: any) => boolean;
  verboseRetryLog?: boolean;
}

/**
 * Attempts to initialize a `DataSource` with configurable retry and backoff.
 *
 * Unlike `@nestjs/typeorm` which uses RxJS `defer().pipe(retryWhen(...))`,
 * this uses a simple async loop — no RxJS dependency required.
 */
export async function initializeWithRetry(
  dataSource: DataSource,
  options: TypeormRetryOptions,
  logger: Logger,
  dataSourceName: string,
): Promise<DataSource> {
  const { retryAttempts = 9, retryDelay = 3000, toRetry, verboseRetryLog } = options;

  for (let attempt = 0; attempt <= retryAttempts; attempt++) {
    try {
      return await dataSource.initialize();
    } catch (err: any) {
      if (toRetry && !toRetry(err)) {
        throw err;
      }
      if (attempt >= retryAttempts) {
        throw err;
      }
      const dsInfo = dataSourceName === 'default' ? '' : ` (${dataSourceName})`;
      const verboseMessage = verboseRetryLog ? ` Message: ${err.message}.` : '';
      logger.log('error', `Unable to connect to the database${dsInfo}.${verboseMessage} Retrying (${attempt + 1})...`);
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }
  throw new Error('Unreachable: exceeded retryAttempts');
}
