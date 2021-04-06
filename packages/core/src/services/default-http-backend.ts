import { Injectable } from '@ts-stack/di';

import { HttpBackend } from '../types/http-interceptor';
import { Request } from './request';
import { CanActivate } from '../types/mix';
import { BodyParser } from './body-parser';
import { NodeRequest, NodeResponse } from '../types/server-options';
import { Logger } from '../types/logger';
import { Status } from '../utils/http-status-codes';
import { RootMetadata } from '../models/root-metadata';
import { RouteData } from '../types/route-data';

@Injectable()
export class DefaultHttpBackend implements HttpBackend {
  constructor(
    private req: Request,
    private log: Logger,
    private rootMetadata: RootMetadata,
    private routeData: RouteData
  ) {}

  async handle() {
    const req = this.req;
    const { controller, methodName, parseBody, guards } = this.routeData;
    req.nodeRes.setHeader('Server', this.rootMetadata.serverName);

    const preparedGuards: { guard: CanActivate; params?: any[] }[] = guards.map((item) => {
      return {
        guard: req.injector.get(item.guard),
        params: item.params,
      };
    });
    const ctrl = req.injector.get(controller);

    for (const item of preparedGuards) {
      const canActivate = await item.guard.canActivate(item.params);
      if (canActivate !== true) {
        const status = typeof canActivate == 'number' ? canActivate : undefined;
        this.canNotActivateRoute(req.nodeReq, req.nodeRes, status);
        return;
      }
    }

    if (parseBody) {
      const bodyParser = req.injector.get(BodyParser) as BodyParser;
      req.body = await bodyParser.getBody();
    }

    await ctrl[methodName]();
  }

  protected canNotActivateRoute(nodeReq: NodeRequest, nodeRes: NodeResponse, status?: Status) {
    this.log.debug(`Can not activate the route with URL: ${nodeReq.method} ${nodeReq.url}`);
    nodeRes.statusCode = status || Status.UNAUTHORIZED;
    nodeRes.end();
  }
}
