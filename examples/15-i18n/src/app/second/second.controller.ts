import { AnyObj, ctx } from '@ditsmod/core';
import { controller, route, PATH_PARAMS, RequestContext } from '@ditsmod/rest';
import { DictService } from '@ditsmod/i18n';

import { FirstService } from '../first/first.service.js';
import { SecondDict } from '#app/second/i18n/current/_base-en/second.dict.js';

@controller()
export class SecondController {
  @route('GET', 'second/:userName')
  tellHello(@ctx(PATH_PARAMS) pathParams: AnyObj, dictService: DictService, reqCtx: RequestContext) {
    const dict = dictService.getDictionary(SecondDict);
    const { userName } = pathParams;
    const msg = dict.hello(userName);

    reqCtx.send(msg);
  }

  @route('GET', 'first-extended')
  tellHefllo(reqCtx: RequestContext, firstService: FirstService) {
    reqCtx.send(firstService.countToThree());
  }
}
