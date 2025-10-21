import { AnyObj, inject } from '@ditsmod/core';
import { controller, route, PATH_PARAMS, Res } from '@ditsmod/rest';
import { DictService } from '@ditsmod/i18n';

import { FirstService } from '../first/first.service.js';
import { SecondDict } from '#app/second/i18n/current/_base-en/second.dict.js';

@controller()
export class SecondController {
  @route('GET', 'second/:userName')
  tellHello(@inject(PATH_PARAMS) pathParams: AnyObj, dictService: DictService, res: Res) {
    const dict = dictService.getDictionary(SecondDict);
    const { userName } = pathParams;
    const msg = dict.hello(userName);

    res.send(msg);
  }

  @route('GET', 'first-extended')
  tellHefllo(res: Res, firstService: FirstService) {
    res.send(firstService.countToThree());
  }
}
