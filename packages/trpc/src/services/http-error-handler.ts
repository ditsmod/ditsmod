import { TrpcOpts } from '#types/types.js';

export class HttpErrorHandler {
  handleError(error: any, opts: TrpcOpts): void | Promise<void> {
    throw error;
  }
}
