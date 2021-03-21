import { Injectable } from '@ts-stack/di';

import { RootMetadata } from '../models/root-metadata';
import { ControllerErrorHandler } from '../types/controller-error-handler';
import { HttpHandler, HttpInterceptor } from '../types/http-interceptor';
import { Logger } from '../types/logger';
import { NodeResponse } from '../types/server-options';
import { Status } from '../utils/http-status-codes';
import { Request } from './request';

@Injectable()
export class DefaultHttpFrontend implements HttpInterceptor {
  constructor(protected log: Logger, protected rootMetadata: RootMetadata) {}

  intercept(req: Request, next: HttpHandler, ...args: any[]) {
    let errorHandler: ControllerErrorHandler;

    try {
      errorHandler = req.injector.get(ControllerErrorHandler);
    } catch (err) {
      this.sendInternalServerError(req.nodeRes, err);
      return;
    }

    return next.handle(req, ...args).catch((err) => {
      errorHandler.handleError(err);
    });
  }

  /**
   * Logs an error and sends the user message about an internal server error (500).
   *
   * @param err An error to logs it (not sends).
   */
  protected sendInternalServerError(nodeRes: NodeResponse, err: Error) {
    this.log.error(err);
    nodeRes.statusCode = Status.INTERNAL_SERVER_ERROR;
    nodeRes.end();
  }
}
