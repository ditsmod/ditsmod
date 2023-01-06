import { controller, RequestContext, route } from '@ditsmod/core';
import { DictService } from '@ditsmod/i18n';

import { FirstService } from '../first/first.service';
import { SecondDict } from '@dict/second/second.dict';

@controller()
export class SecondController {
  constructor(private dictService: DictService, private firstService: FirstService) {}

  @route('GET', 'second/:userName')
  tellHello(ctx: RequestContext) {
    const dict = this.dictService.getDictionary(SecondDict);
    const { userName } = ctx.req.pathParams;
    const msg = dict.hello(userName);

    ctx.res.send(msg);
  }

  @route('GET', 'first-extended')
  tellHefllo(ctx: RequestContext) {
    ctx.res.send(this.firstService.countToThree());
  }
}
