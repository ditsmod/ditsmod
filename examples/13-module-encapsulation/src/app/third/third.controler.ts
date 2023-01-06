import { controller, route, inject, RequestContext } from '@ditsmod/core';

@controller()
export class ThirdController {
  constructor(@inject('multi-provider') private multiProvider: any) {}

  @route('GET', 'third')
  getHello(ctx: RequestContext) {
    ctx.res.sendJson(this.multiProvider);
  }
}
