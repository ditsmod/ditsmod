import { inject } from '@ditsmod/core';
import { controller, route, RequestContext } from '@ditsmod/rest';

@controller()
export class SecondController {
  constructor(@inject('multi-provider') private multiProvider: any) {}

  @route('GET', 'second')
  getHello(reqCtx: RequestContext) {
    reqCtx.sendJson(this.multiProvider);
  }
}
