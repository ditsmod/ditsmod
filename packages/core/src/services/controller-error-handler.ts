export class ControllerErrorHandler {
  handleError(error: any): void | Promise<void> {
    throw error;
  }
}
