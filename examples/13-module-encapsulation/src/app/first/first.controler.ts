import { inject } from '@ditsmod/core';
import { controller, route, RequestContext } from '@ditsmod/rest';

@controller()
export class FirstController {
  constructor(@inject('multi-provider') private multiProvider: any) {}

  @route('GET', 'first')
  getHello(ctx: RequestContext) {
    ctx.sendJson(this.multiProvider);
  }
}
