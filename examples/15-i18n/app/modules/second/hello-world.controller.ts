import { Controller, Res, Route } from '@ditsmod/core';
import { I18nService } from '@ditsmod/i18n';

import { Common } from './locales/current/en/common';

@Controller()
export class HelloWorldController {
  constructor(private res: Res, private i18nService: I18nService) {}

  @Route('GET')
  tellHello() {
    const dict = this.i18nService.getDictionary(Common);
    const msg = dict.hello('Костя');

    this.res.send(msg);
  }
}
