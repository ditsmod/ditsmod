import { controller, route, inject, RequestContext } from '@ditsmod/core';

@controller()
export class SecondController {
  constructor(@inject('multi-provider') private multiProvider: any) {}

  @route('GET', 'second')
  getHello(ctx: RequestContext) {
    ctx.res.sendJson(this.multiProvider);
  }
}
