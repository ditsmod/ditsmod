import { controller, route, inject, RequestContext } from '@ditsmod/core';

@controller()
export class FirstController {
  constructor(@inject('multi-provider') private multiProvider: any) {}

  @route('GET', 'first')
  getHello(ctx: RequestContext) {
    ctx.res.sendJson(this.multiProvider);
  }
}
