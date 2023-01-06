import { controller, RequestContext, route } from '@ditsmod/core';

@controller()
export class SomeController {
  @route('GET')
  tellHello(ctx: RequestContext) {
    ctx.res.send('Hello, you need send POST request');
  }

  @route('POST')
  ok(ctx: RequestContext) {
    ctx.res.sendJson(ctx.req.body);
  }
}
