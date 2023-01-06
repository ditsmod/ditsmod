import { RequestContext } from '../types/route-data';

export class ControllerErrorHandler {
  handleError(ctx: RequestContext, error: any): void | Promise<void> {
    throw error;
  }
}
