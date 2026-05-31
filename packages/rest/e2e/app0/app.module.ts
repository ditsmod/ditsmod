import { rootModule, Providers, ctx, type Context } from '@ditsmod/core';
import {
  QUERY_PARAMS,
  PATH_PARAMS,
  Res,
  Req,
  controller,
  route,
  RestModule,
  initRest,
  RAW_REQ,
} from '@ditsmod/rest';

import { Interceptor1 } from './interceptor1.js';

@controller({ providersPerReq: [{ token: 'msg' }] })
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
  tellHello(ctx: Context) {
    const pathParams = ctx.get(PATH_PARAMS, true)!;
    const queryParams = ctx.get(QUERY_PARAMS, true)!;
    return { pathParams, queryParams };
  }

  @route(['GET', 'POST'], 'get-array1')
  [Symbol()](ctx: Context) {
    const res = ctx.get(Res)!;
    const rawReq = ctx.get(RAW_REQ, true)!;
    return res.sendJson(rawReq.headers);
  }

  @route('GET', 'interceptor1', [], [Interceptor1])
  withInterceptors(ctx: Context) {
    return (ctx as Context & { msg: string }).msg;
  }
}

@initRest({ controllers: [RequestScopedController, RouteScopedController] })
@rootModule({
  imports: [RestModule],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
})
export class AppModule {}
