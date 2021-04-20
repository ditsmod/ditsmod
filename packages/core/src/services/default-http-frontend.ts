import { Inject, Injectable } from '@ts-stack/di';
import { parse } from 'querystring';

import { ControllerErrorHandler } from '../services/controller-error-handler';
import { HttpFrontend, HttpHandler } from '../types/http-interceptor';
import { NodeResponse } from '../types/server-options';
import { Status } from '../utils/http-status-codes';
import { Request } from './request';
import { AnyObj } from '../types/mix';
import { PathParam } from '../types/router';
import { PATH_PARAMS, QUERY_STRING } from '../constans';
import { Log } from './log';

@Injectable()
export class DefaultHttpFrontend implements HttpFrontend {
  constructor(
    @Inject(PATH_PARAMS) protected pathParamsArr: PathParam[],
    @Inject(QUERY_STRING) protected queryString: any,
    private req: Request,
    private log: Log
  ) {}

  async intercept(next: HttpHandler) {
    try {
      if (this.queryString) {
        this.req.queryParams = parse(this.queryString);
      }
      if (this.pathParamsArr) {
        this.req.pathParamsArr = this.pathParamsArr;
        const pathParams: AnyObj = this.pathParamsArr?.length ? {} : undefined;
        this.pathParamsArr?.forEach((param) => (pathParams[param.key] = param.value));
        this.req.pathParams = pathParams;
      }
    } catch (err) {
      this.lazyLoadErrorHandler(err);
    }

    await next.handle().catch((err) => {
      this.lazyLoadErrorHandler(err);
    });
  }

  protected lazyLoadErrorHandler(err: any) {
    try {
      const errorHandler = this.req.injector.get(ControllerErrorHandler);
      errorHandler.handleError(err);
    } catch (err) {
      this.sendInternalServerError(this.req.nodeRes, err);
    }
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
    this.log.internalServerError('error', [err]);
    nodeRes.statusCode = Status.INTERNAL_SERVER_ERROR;
    nodeRes.end();
  }
}
