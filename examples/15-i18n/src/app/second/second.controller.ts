import { AnyObj, ctx } from '@ditsmod/core';
import { controller, route, PATH_PARAMS, RequestContext } from '@ditsmod/rest';
import { DictService } from '@ditsmod/i18n';

import { FirstService } from '../first/first.service.js';
import { SecondDict } from '#app/second/i18n/current/_base-en/second.dict.js';

@controller()
export class SecondController {
  @route('GET', 'second/:userName')
  tellHello(@ctx(PATH_PARAMS) pathParams: AnyObj, dictService: DictService, ctx: RequestContext) {
    const dict = dictService.getDictionary(SecondDict);
    const { userName } = pathParams;
    const msg = dict.hello(userName);

    ctx.send(msg);
  }

  @route('GET', 'first-extended')
  tellHefllo(ctx: RequestContext, firstService: FirstService) {
    ctx.send(firstService.countToThree());
  }
}
