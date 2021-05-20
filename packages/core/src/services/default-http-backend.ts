import { Injectable } from '@ts-stack/di';

import { HttpBackend } from '../types/http-interceptor';
import { Request } from './request';
import { CanActivate } from '../types/mix';
import { NodeRequest, NodeResponse } from '../types/server-options';
import { Status } from '../utils/http-status-codes';
import { RootMetadata } from '../models/root-metadata';
import { RouteMeta } from '../types/route-data';
import { Log } from './log';

@Injectable()
export class DefaultHttpBackend implements HttpBackend {
  constructor(
    private req: Request,
    private log: Log,
    private rootMetadata: RootMetadata,
    private routeMeta: RouteMeta
  ) {}

  async handle() {
    const req = this.req;
    const { controller, methodName, guards } = this.routeMeta;
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

    await ctrl[methodName]();
  }

  protected canNotActivateRoute(nodeReq: NodeRequest, nodeRes: NodeResponse, status?: Status) {
    this.log.youCannotActivateRoute('debug', [nodeReq.method, nodeReq.url]);
    nodeRes.statusCode = status || Status.UNAUTHORIZED;
    nodeRes.end();
  }
}
