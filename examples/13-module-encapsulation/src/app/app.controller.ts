import { controller, route, inject, RequestContext} from '@ditsmod/core';

import { FirstPerRouService } from './first/first-per-rou.service';
import { ThirdService } from './third/three.service';

@controller()
export class AppController {
  constructor(
    private threeService: ThirdService,
    private onePerRouService: FirstPerRouService,
    @inject('multi-provider') private multiProvider: any
  ) {}

  @route('GET')
  showCounters(ctx: RequestContext) {
    const msg = `per req counter: ${this.threeService.getCounter()}, per rou counter: ${this.onePerRouService.getCounter()}`;
    ctx.res.send(msg);
  }

  @route('POST')
  showRequestBody(ctx: RequestContext) {
    ctx.res.sendJson({ body: this.threeService.getBody(ctx.req) });
  }

  @route('GET', 'zero')
  getMultiProvideValue(ctx: RequestContext) {
    ctx.res.sendJson(this.multiProvider);
  }
}
