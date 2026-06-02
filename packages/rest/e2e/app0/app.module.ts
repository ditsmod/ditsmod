import { rootModule, Providers, ctx } from '@ditsmod/core';
import {
  QUERY_PARAMS,
  PATH_PARAMS,
  Res,
  Req,
  controller,
  route,
  RestModule,
  RequestContext,
  initRest,
} from '@ditsmod/rest';

import { Interceptor1 } from './interceptor1.js';

@controller()
export class RequestScopedController {
  @route('GET', 'get0/:pathParam1/:pathParam2')
  tellHello(@ctx(QUERY_PARAMS) queryParams: any, @ctx(PATH_PARAMS) pathParams: any) {
    return { pathParams, queryParams };
  }

  @route(['GET', 'POST'], 'get-array0')
  [Symbol()](req: Req, res: Res) {
    return res.sendJson(req.rawReq.headers);
  }

  @route('GET', 'interceptor0', [], [Interceptor1])
  withInterceptors(@ctx('msg') msg: string) {
    return msg;
  }
}

@controller({ scope: 'route' })
export class RouteScopedController {
  @route('GET', 'get1/:pathParam1/:pathParam2')
  tellHello(reqCtx: RequestContext) {
    return { pathParams: reqCtx.pathParams, queryParams: reqCtx.queryParams };
  }

  @route(['GET', 'POST'], 'get-array1')
  [Symbol()](reqCtx: RequestContext) {
    return reqCtx.sendJson(reqCtx.rawReq.headers);
  }

  @route('GET', 'interceptor1', [], [Interceptor1])
  withInterceptors(reqCtx: RequestContext) {
    return (reqCtx as RequestContext & { msg: string }).msg;
  }
}

@initRest({ controllers: [RequestScopedController, RouteScopedController] })
@rootModule({
  imports: [RestModule],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
})
export class AppModule {}
