import { controller, Res, route, inject, RequestContext} from '@ditsmod/core';

import { FirstPerRouService } from './first/first-per-rou.service';
import { ThirdService } from './third/three.service';

@controller()
export class AppController {
  constructor(
    private threeService: ThirdService,
    private onePerRouService: FirstPerRouService,
    private res: Res,
    @inject('multi-provider') private multiProvider: any
  ) {}

  @route('GET')
  showCounters() {
    const msg = `per req counter: ${this.threeService.getCounter()}, per rou counter: ${this.onePerRouService.getCounter()}`;
    this.res.send(msg);
  }

  @route('POST')
  showRequestBody(ctx: RequestContext) {
    this.res.sendJson({ body: this.threeService.getBody(ctx.req) });
  }

  @route('GET', 'zero')
  getMultiProvideValue() {
    this.res.sendJson(this.multiProvider);
  }
}
