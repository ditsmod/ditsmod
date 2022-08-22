import { Controller, Req, Res, Route } from '@ditsmod/core';
import { I18nService } from '@ditsmod/i18n';

import { FirstService } from '../../service/first/first.service';
import { Common } from './locales/current/en/common';

@Controller()
export class SecondController {
  constructor(private req: Req, private res: Res, private i18nService: I18nService, private firstService: FirstService) {}

  @Route('GET', 'second/:userName')
  tellHello() {
    const dict = this.i18nService.getDictionary(Common);
    const { userName } = this.req.pathParams;
    const msg = dict.hello(userName);

    this.res.send(msg);
  }

  @Route('GET', 'second')
  tellHefllo() {
    this.res.send(this.firstService.countToThree());
  }
}
