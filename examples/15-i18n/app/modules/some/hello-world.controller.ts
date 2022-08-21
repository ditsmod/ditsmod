import { Controller, Res, Route } from '@ditsmod/core';
import { I18nService } from '@ditsmod/i18n';

import { TranslationDefault } from './locales/current/en/translation';

@Controller()
export class HelloWorldController {
  constructor(private res: Res, private i18nService: I18nService) {}

  @Route('GET')
  tellHello() {
    const msg = this.i18nService.t(TranslationDefault, 'uk', 'hello', 'Костя');
    this.res.send(msg);
  }
}
