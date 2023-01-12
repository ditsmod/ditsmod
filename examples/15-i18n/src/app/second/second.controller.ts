import { controller, Req, Res, route } from '@ditsmod/core';
import { DictService } from '@ditsmod/i18n';

import { FirstService } from '../first/first.service';
import { SecondDict } from '@dict/second/second.dict';

@controller()
export class SecondController {
  constructor(private dictService: DictService, private firstService: FirstService) {}

  @route('GET', 'second/:userName')
  tellHello(req: Req, res: Res) {
    const dict = this.dictService.getDictionary(SecondDict);
    const { userName } = req.pathParams;
    const msg = dict.hello(userName);

    res.send(msg);
  }

  @route('GET', 'first-extended')
  tellHefllo(res: Res) {
    res.send(this.firstService.countToThree());
  }
}
