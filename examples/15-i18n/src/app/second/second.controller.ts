import { controller, Req, Res, route } from '@ditsmod/core';
import { DictService } from '@ditsmod/i18n';

import { FirstService } from '../first/first.service';
import { SecondDict } from '@dict/second/second.dict';

@controller()
export class SecondController {
  constructor(private req: Req, private res: Res, private dictService: DictService, private firstService: FirstService) {}

  @route('GET', 'second/:userName')
  tellHello() {
    const dict = this.dictService.getDictionary(SecondDict);
    const { userName } = this.req.pathParams;
    const msg = dict.hello(userName);

    this.res.send(msg);
  }

  @route('GET', 'first-extended')
  tellHefllo() {
    this.res.send(this.firstService.countToThree());
  }
}
