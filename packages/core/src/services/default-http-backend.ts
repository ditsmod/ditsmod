import { Injectable } from '@ts-stack/di';
import { parse } from 'querystring';

import { HttpBackend } from '../types/http-interceptor';
import { Request } from './request';
import { AnyObj } from '../types/any-obj';
import { CanActivate } from '../types/can-activate';
import { ControllerErrorHandler } from '../types/controller-error-handler';
import { NormalizedGuard } from '../types/normalized-guard';
import { BodyParser } from './body-parser';
import { ControllerType } from '../types/controller-type';
import { PathParam } from '../types/router';
import { NodeRequest, NodeResponse } from '../types/server-options';
import { Logger } from '../types/logger';
import { Status } from '../utils/http-status-codes';
import { RootMetadata } from '../models/root-metadata';

@Injectable()
export class DefaultHttpBackend implements HttpBackend {
  constructor(protected log: Logger, protected rootMetadata: RootMetadata) {}

  /**
   * @param controller Controller class.
   * @param methodName Method of the Controller.
   * @param parseBody Need or not to parsing a body request.
   */
  async handle(
    req: Request,
    pathParamsArr: PathParam[],
    queryString: string,
    controller: ControllerType,
    methodName: string,
    parseBody: boolean,
    guards: NormalizedGuard[]
  ) {
    let errorHandler: ControllerErrorHandler;
    let ctrl: any;
    let preparedGuards: { guard: CanActivate; params?: any[] }[] = [];

    try {
      req.nodeRes.setHeader('Server', this.rootMetadata.serverName);
      req.pathParamsArr = pathParamsArr;
      const pathParams: AnyObj = pathParamsArr ? {} : undefined;
      pathParamsArr?.forEach((param) => (pathParams[param.key] = param.value));
      req.pathParams = pathParams;

      errorHandler = req.injector.get(ControllerErrorHandler);
      preparedGuards = guards.map((item) => {
        return {
          guard: req.injector.get(item.guard),
          params: item.params,
        };
      });
      ctrl = req.injector.get(controller);
    } catch (err) {
      this.sendInternalServerError(req.nodeRes, err);
      return;
    }

    try {
      for (const item of preparedGuards) {
        const canActivate = await item.guard.canActivate(item.params);
        if (canActivate !== true) {
          const status = typeof canActivate == 'number' ? canActivate : undefined;
          this.canNotActivateRoute(req.nodeReq, req.nodeRes, status);
          return;
        }
      }

      req.queryParams = parse(queryString);
      if (parseBody) {
        const bodyParser = req.injector.get(BodyParser) as BodyParser;
        req.body = await bodyParser.getBody();
      }

      await ctrl[methodName]();
    } catch (err) {
      errorHandler.handleError(err);
    }
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

  protected canNotActivateRoute(nodeReq: NodeRequest, nodeRes: NodeResponse, status?: Status) {
    this.log.debug(`Can not activate the route with URL: ${nodeReq.method} ${nodeReq.url}`);
    nodeRes.statusCode = status || Status.UNAUTHORIZED;
    nodeRes.end();
  }
}
