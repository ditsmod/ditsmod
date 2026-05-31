import type { Context } from '@ditsmod/core';

export class HttpErrorHandler {
  handleError(error: any, ctx: Context): void | Promise<void> {
    throw error;
  }
}
