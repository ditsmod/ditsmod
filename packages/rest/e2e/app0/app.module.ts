import { rootModule, Providers, inject } from '@ditsmod/core';
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

@controller({ providersPerReq: [{ token: 'msg' }] })
export class DefaultController {
  @route('GET', 'get0/:pathParam1/:pathParam2')
  tellHello(@inject(QUERY_PARAMS) queryParams: any, @inject(PATH_PARAMS) pathParams: any) {
    return { pathParams, queryParams };
  }

  @route(['GET', 'POST'], 'get-array0')
  [Symbol()](req: Req, res: Res) {
    return res.sendJson(req.rawReq.headers);
  }

  @route('GET', 'interceptor0', [], [Interceptor1])
  withInterceptors(@inject('msg') msg: string) {
    return msg;
  }
}

@controller({ scope: 'ctx' })
export class CtxController {
  @route('GET', 'get1/:pathParam1/:pathParam2')
  tellHello(ctx: RequestContext) {
    return { pathParams: ctx.pathParams, queryParams: ctx.queryParams };
  }

  @route(['GET', 'POST'], 'get-array1')
  [Symbol()](ctx: RequestContext) {
    return ctx.sendJson(ctx.rawReq.headers);
  }

  @route('GET', 'interceptor1', [], [Interceptor1])
  withInterceptors(ctx: RequestContext) {
    return (ctx as RequestContext & { msg: string }).msg;
  }
}

@initRest({ controllers: [DefaultController, CtxController] })
@rootModule({
  imports: [RestModule],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
})
export class AppModule {}
