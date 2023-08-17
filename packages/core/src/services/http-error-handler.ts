export class HttpErrorHandler {
  handleError(error: any): void | Promise<void> {
    throw error;
  }
}
