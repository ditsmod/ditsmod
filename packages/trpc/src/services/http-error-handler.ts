import { TrpcOpts } from '#types/constants.js';

export class HttpErrorHandler {
  handleError(error: any, opts: TrpcOpts): void | Promise<void> {
    throw error;
  }
}
