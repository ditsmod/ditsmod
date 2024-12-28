import {
  controller,
  rootModule,
  Providers,
  inject,
  QUERY_PARAMS,
  PATH_PARAMS,
  Res,
  Req,
  SingletonRequestContext,
} from '@ditsmod/core';
import { route, RoutingModule } from '@ditsmod/routing';

@controller()
export class DefaultController {
  @route('GET', 'get0/:pathParam1/:pathParam2')
  tellHello(@inject(QUERY_PARAMS) queryParams: any, @inject(PATH_PARAMS) pathParams: any) {
    return { pathParams, queryParams };
  }

  @route(['GET', 'POST'], 'get-array0')
  [Symbol()](req: Req, res: Res) {
    return res.sendJson(req.rawReq.headers);
  }
}

@controller({ scope: 'ctx' })
export class SingletonController {
  @route('GET', 'get1/:pathParam1/:pathParam2')
  tellHello(ctx: SingletonRequestContext) {
    return { pathParams: ctx.pathParams, queryParams: ctx.queryParams };
  }

  @route(['GET', 'POST'], 'get-array1')
  [Symbol()](ctx: SingletonRequestContext) {
    return ctx.sendJson(ctx.rawReq.headers);
  }
}

@rootModule({
  imports: [RoutingModule],
  controllers: [DefaultController, SingletonController],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
})
export class AppModule {}
