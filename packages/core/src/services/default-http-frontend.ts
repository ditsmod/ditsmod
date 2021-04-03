import { Inject, Injectable } from '@ts-stack/di';

import { ControllerErrorHandler } from '../types/controller-error-handler';
import { HttpFrontend, HttpHandler } from '../types/http-interceptor';
import { Logger } from '../types/logger';
import { NodeResponse } from '../types/server-options';
import { Status } from '../utils/http-status-codes';
import { Request } from './request';
import { AnyObj } from '../types/any-obj';
import { PathParam, PATH_PARAMS, QUERY_STRING } from '../types/router';

@Injectable()
export class DefaultHttpFrontend implements HttpFrontend {
  constructor(
    @Inject(PATH_PARAMS) protected pathParamsArr: PathParam[],
    @Inject(QUERY_STRING) protected queryString: any,
    private req: Request,
    private log: Logger,
  ) {}

  intercept(next: HttpHandler) {
    let errorHandler: ControllerErrorHandler;

    try {
      errorHandler = this.req.injector.get(ControllerErrorHandler);
    } catch (err) {
      this.sendInternalServerError(this.req.nodeRes, err);
      return;
    }

    try {
      this.req.queryParams = this.queryString;
      this.req.pathParamsArr = this.pathParamsArr;
      const pathParams: AnyObj = this.pathParamsArr?.length ? {} : undefined;
      this.pathParamsArr?.forEach((param) => (pathParams[param.key] = param.value));
      this.req.pathParams = pathParams;
    } catch (err) {
      errorHandler.handleError(err);
    }

    return next.handle().catch((err) => {
      errorHandler.handleError(err);
    });
  }

  protected decodeUrl(url: string) {
    return decodeURI(url);
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
