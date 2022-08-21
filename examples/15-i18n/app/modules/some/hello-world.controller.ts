import { Controller, Res, Route } from '@ditsmod/core';
import { I18nService } from '@ditsmod/i18n';

import { Common } from './locales/current/en/common';

@Controller()
export class HelloWorldController {
  constructor(private res: Res, private i18nService: I18nService) {}

  @Route('GET')
  tellHello() {
    let msg = this.i18nService.translate(Common, 'uk', 'hello', 'Костя');

    // OR
    const hello = this.i18nService.getMethod(Common, 'uk', 'hello');
    msg = hello('Костя');

    // OR
    const dict = this.i18nService.getDictionary(Common, 'uk');
    msg = dict.hello('Костя');

    // OR
    const dictionaries = this.i18nService.getAllDictionaries(Common);
    const dictionary = dictionaries.find(t => t.lng == 'uk');
    msg = dictionary.hello('Костя');

    this.res.send(msg);
  }
}
