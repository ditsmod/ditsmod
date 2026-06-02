import { inject } from '@ditsmod/core';
import { controller, route, RequestContext } from '@ditsmod/rest';

@controller()
export class ThirdController {
  constructor(@inject('multi-provider') private multiProvider: any) {}

  @route('GET', 'third')
  getHello(reqCtx: RequestContext) {
    reqCtx.sendJson(this.multiProvider);
  }
}
